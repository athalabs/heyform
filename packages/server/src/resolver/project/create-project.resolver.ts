import { Auth, Team, TeamGuard, User } from '@decorator'
import { CreateProjectInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService } from '@service'

const { uniqueArray } = helper

@Resolver()
@Auth()
export class CreateProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @TeamGuard()
  @Mutation(returns => String)
  async createProject(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: CreateProjectInput
  ): Promise<string> {
    const projectId = await this.projectService.create({
      teamId: input.teamId,
      name: input.name,
      ownerId: user.id
    })

    const memberIds: string[] = uniqueArray([
      team.ownerId,

      user.id,
      ...(helper.isValidArray(input.memberIds) ? input.memberIds : [])
    ])

    await this.projectService.addMembers(
      memberIds.map(memberId => ({
        projectId,
        memberId
      }))
    )

    return projectId
  }
}
