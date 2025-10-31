import { Controller, Get, Query, Req, Res } from '@nestjs/common'

import { helper } from '@heyform-inc/utils'

import { AuthService, OAuth2Service, RedisService } from '@service'
import { Logger } from '@utils'

@Controller()
export class OAuth2Controller {
  private readonly logger: Logger

  constructor(
    private readonly oauth2Service: OAuth2Service,
    private readonly authService: AuthService,
    private readonly redisService: RedisService
  ) {
    this.logger = new Logger(OAuth2Controller.name)
  }

  /**
   * Redirect to OAuth2 provider's authorization URL
   *
   * Example:
   * http://my.heyformhq.com/auth/oauth2?state=DMbcJqLJ
   */
  @Get('/auth/oauth2')
  async authorize(@Query('state') state: string, @Res() res: any) {
    if (helper.isEmpty(state)) {
      return res.render('index', {
        rendererData: {
          error: 'UNABLE_CONNECT_OAUTH2'
        }
      })
    }

    try {
      const authUrl = this.oauth2Service.authorizationUrl(state)

      if (helper.isEmpty(authUrl)) {
        return res.render('index', {
          rendererData: {
            error: 'UNABLE_CONNECT_OAUTH2'
          }
        })
      }

      res.redirect(302, authUrl)
    } catch (err) {
      this.logger.error(err)

      return res.render('index', {
        rendererData: {
          error: 'UNABLE_CONNECT_OAUTH2'
        }
      })
    }
  }

  /**
   * OAuth2 callback handler
   *
   * Example:
   * http://my.heyformhq.com/auth/oauth2/callback?code=xyz&state=DMbcJqLJ
   */
  @Get('/auth/oauth2/callback')
  async callback(
    @Query() query: Record<string, string>,
    @Req() req: any,
    @Res() res: any
  ) {
    try {
      const { code, state } = query

      if (helper.isEmpty(code) || helper.isEmpty(state)) {
        throw new Error('Missing code or state parameter')
      }

      // Authenticate user and get userId
      const userId = await this.oauth2Service.authenticateUser(code)

      // Store redirect_uri if exists
      const key = `redirect_uri:${state}`
      let redirectUri = await this.redisService.get(key)

      // Login user
      await this.authService.login({
        res,
        userId,
        browserId: state
      })

      // Prepare redirect URL
      if (helper.isValid(redirectUri)) {
        redirectUri = `/?redirect_uri=${encodeURIComponent(redirectUri)}`
      } else {
        redirectUri = '/'
      }

      res.render('social-login', {
        redirectUri
      })
    } catch (err) {
      this.logger.error(err)

      res.render('index', {
        rendererData: {
          error: 'UNABLE_CONNECT_OAUTH2'
        }
      })
    }
  }
}
