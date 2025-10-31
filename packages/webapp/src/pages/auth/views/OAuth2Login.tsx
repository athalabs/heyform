import { qs, removeObjectNil } from '@heyform-inc/utils'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import { getBrowserId, useQuery, useRouter } from '@/utils'

export const OAuth2Login: FC = () => {
  const query = useQuery()
  const router = useRouter()
  const { t } = useTranslation()

  function handleOAuth2Login() {
    const state = getBrowserId()
    const q = removeObjectNil({
      state,
      redirect_uri: query.redirect_uri
    })

    router.redirect(`/auth/oauth2?${qs.stringify(q, { encode: true })}`)
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">
        {t('login.oauth2Description', 'Sign in using your organization\'s single sign-on.')}
      </p>
      <Button type="primary" block onClick={handleOAuth2Login}>
        {t('login.oauth2Button', 'Sign in with OAuth2')}
      </Button>
    </div>
  )
}
