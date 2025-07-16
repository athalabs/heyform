import { BadRequestException, UseGuards } from '@nestjs/common'

import { GraphqlResponse } from '@decorator'
import { BCRYPT_SALT } from '@environments'
import { SignUpInput } from '@graphql'
import { DeviceIdGuard } from '@guard'
import { helper } from '@heyform-inc/utils'
import { UserActivityKindEnum } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AuthService, UserService } from '@service'
import { ClientInfo, GqlClient, gravatar, passwordHash } from '@utils'
import { isDisposableEmail } from '@utils'

@Resolver()
@UseGuards(DeviceIdGuard)
export class SignUpResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Query(returns => Boolean)
  async signUp(
    @GqlClient() client: ClientInfo,
    @GraphqlResponse() res: any,
    @Args('input') input: SignUpInput
  ): Promise<boolean> {
    if (isDisposableEmail(input.email)) {
      throw new BadRequestException(
        'Error: Disposable email address detected, please use a work email to create the account'
      )
    }

    const existUser = await this.userService.findByEmail(input.email)

    if (helper.isValid(existUser)) {
      throw new BadRequestException('The email address already exist')
    }

    const userId = await this.userService.create({
      name: input.name,
      email: input.email,
      password: await passwordHash(input.password, BCRYPT_SALT),
      avatar: gravatar(input.email),
      lang: client.lang
    })

    this.authService.createUserActivity({
      kind: UserActivityKindEnum.SIGN_UP,
      userId,
      ...client
    })

    await this.authService.login({
      res,
      userId,
      deviceId: client.deviceId
    })

    return true
  }
}
