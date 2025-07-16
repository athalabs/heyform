import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class AppSettingType {
  @Field()
  type: string

  @Field()
  name: string

  @Field()
  label: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  placeholder?: string

  @Field()
  required: boolean
}

@ObjectType()
export class AppType {
  @Field({ nullable: true })
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  icon?: string

  @Field(type => [AppSettingType], { nullable: true })
  settings?: AppSettingType[]
}
