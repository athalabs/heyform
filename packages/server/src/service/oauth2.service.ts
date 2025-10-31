import { BadRequestException, Injectable } from '@nestjs/common'
import axios from 'axios'
import { stringify } from 'querystring'

import { helper } from '@heyform-inc/utils'

import {
  OAUTH2_AUTHORIZATION_URL,
  OAUTH2_CALLBACK_URL,
  OAUTH2_CLIENT_ID,
  OAUTH2_CLIENT_SECRET,
  OAUTH2_SCOPE,
  OAUTH2_TOKEN_URL,
  OAUTH2_USERINFO_URL,
  OAUTH2_USER_AVATAR_FIELD,
  OAUTH2_USER_EMAIL_FIELD,
  OAUTH2_USER_ID_FIELD,
  OAUTH2_USER_NAME_FIELD
} from '@environments'

import { UserService } from './user.service'

export interface OAuth2UserInfo {
  openId: string
  email?: string
  name?: string
  avatar?: string
}

@Injectable()
export class OAuth2Service {
  constructor(private readonly userService: UserService) {}

  public authorizationUrl(state: string): string {
    const params = {
      client_id: OAUTH2_CLIENT_ID,
      redirect_uri: OAUTH2_CALLBACK_URL,
      response_type: 'code',
      scope: OAUTH2_SCOPE,
      state
    }

    return `${OAUTH2_AUTHORIZATION_URL}?${stringify(params)}`
  }

  public async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        OAUTH2_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: OAUTH2_CALLBACK_URL,
          client_id: OAUTH2_CLIENT_ID,
          client_secret: OAUTH2_CLIENT_SECRET
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      if (!response.data?.access_token) {
        throw new BadRequestException('Failed to obtain access token')
      }

      return response.data.access_token
    } catch (error) {
      throw new BadRequestException('OAuth2 token exchange failed')
    }
  }

  public async getUserInfo(accessToken: string): Promise<OAuth2UserInfo> {
    try {
      const response = await axios.get(OAUTH2_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      const userData = response.data

      if (!userData || !userData[OAUTH2_USER_ID_FIELD]) {
        throw new BadRequestException('Invalid user information received')
      }

      return {
        openId: userData[OAUTH2_USER_ID_FIELD],
        email: userData[OAUTH2_USER_EMAIL_FIELD],
        name: userData[OAUTH2_USER_NAME_FIELD],
        avatar: userData[OAUTH2_USER_AVATAR_FIELD]
      }
    } catch (error) {
      throw new BadRequestException('Failed to fetch user information')
    }
  }

  public async authenticateUser(code: string): Promise<string> {
    // Exchange code for access token
    const accessToken = await this.exchangeCodeForToken(code)

    // Get user info
    const userInfo = await this.getUserInfo(accessToken)

    if (helper.isEmpty(userInfo.email)) {
      throw new BadRequestException('Email is required from OAuth2 provider')
    }

    // Check if user exists
    let user = await this.userService.findByEmail(userInfo.email)

    if (!user) {
      // Create new user
      const userId = await this.userService.create({
        name: userInfo.name || userInfo.email,
        email: userInfo.email,
        avatar: userInfo.avatar,
        isEmailVerified: true
      })

      user = await this.userService.findById(userId)
    }

    return user.id
  }
}
