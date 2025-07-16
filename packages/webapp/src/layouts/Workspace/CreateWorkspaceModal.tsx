import { useBoolean } from 'ahooks'
import { FC, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { clearCookie, getCookie, useRouter } from '@/utils'
import { helper } from '@heyform-inc/utils'

import { Form, ImageFormPicker, Input, Modal, SimpleFormProps } from '@/components'
import { DEFAULT_PROJECT_NAMES, REDIRECT_COOKIE_NAME } from '@/consts'
import { useModal, useUserStore } from '@/store'
import { useAppStore } from '@/store'

export const CreateWorkspaceForm: FC<
  Pick<SimpleFormProps, 'onLoadingChange'> & { onSuccess?: () => void }
> = ({ onLoadingChange, onSuccess }) => {
  const { t, i18n } = useTranslation()

  const router = useRouter()
  const { user } = useUserStore()
  const { closeModal } = useAppStore()

  const redirectUri = getCookie(REDIRECT_COOKIE_NAME) as string
  const [name, setName] = useState<string>('H')

  async function fetch(values: any) {
    const projectName = (DEFAULT_PROJECT_NAMES[i18n.language] || DEFAULT_PROJECT_NAMES.en).replace(
      '{name}',
      user.name
    )

    const result = await WorkspaceService.create({
      ...values,
      projectName
    })

    if (helper.isValid(redirectUri)) {
      clearCookie(REDIRECT_COOKIE_NAME)
      if (onSuccess) onSuccess()
      closeModal('CreateWorkspaceModal')
      return router.redirect(redirectUri, {
        extend: false
      })
    }

    if (onSuccess) onSuccess()
    closeModal('CreateWorkspaceModal')
    router.replace(`/workspace/${result}`)
  }

  function onValuesChange(changes: AnyMap) {
    if (changes.name) {
      setName(changes.name)
    }
  }

  return (
    <Form.Simple
      className="space-y-4"
      fetch={fetch}
      submitProps={{
        className: 'px-5 !mt-6 min-w-24',
        size: 'md',
        label: t('components.continue')
      }}
      onLoadingChange={onLoadingChange}
      onValuesChange={onValuesChange}
    >
      <Form.Item
        name="name"
        label={t('workspace.creation.name.label')}
        rules={[
          {
            required: true,
            message: t('workspace.creation.name.required')
          }
        ]}
      >
        <Input autoComplete="off" />
      </Form.Item>

      <Form.Item
        name="avatar"
        label={
          <Trans
            key="avatar"
            t={t}
            i18nKey="workspace.creation.logo"
            components={{
              span: <span className="text-secondary" />
            }}
          />
        }
      >
        <ImageFormPicker fallback={name} />
      </Form.Item>
    </Form.Simple>
  )
}

export default function CreateWorkspaceModal() {
  const { t } = useTranslation()

  const { isOpen, onOpenChange } = useModal('CreateWorkspaceModal')
  const [loading, { set }] = useBoolean(false)

  return (
    <Modal.Simple
      open={isOpen}
      title={t('workspace.creation.headline')}
      description={t('workspace.creation.subHeadline')}
      loading={loading}
      onOpenChange={onOpenChange}
    >
      <CreateWorkspaceForm onLoadingChange={set} onSuccess={() => {}} />
    </Modal.Simple>
  )
}
