import { pickObject } from '@heyform-inc/utils'

import { GEETEST_ID, RECAPTCHA_KEY } from '../consts'

export function initGeeTest(): Promise<Any> {
  return new Promise(resolve => {
    window.initGeetest4(
      {
        captchaId: GEETEST_ID,
        product: 'bind',
        mask: {
          outside: false,
          bgColor: '#00000000'
        },
        hideBar: ['close']
      },
      (instance: Any) => {
        instance.onReady(() => {
          resolve(instance)
        })
      }
    )
  })
}

export function recaptchaToken(instance: Any): Promise<string> {
  return new Promise((resolve, reject) => {
    instance.ready(() => {
      instance
        .execute(RECAPTCHA_KEY, {
          action: 'submit'
        })
        .then(resolve)
        .catch(reject)
    })
  })
}

export function geeTestToken(instance: Any): Promise<Any> {
  return new Promise((resolve, reject) => {
    instance.onSuccess(() => {
      const values = instance.getValidate()
      const data = pickObject(values, [
        ['lot_number', 'lotNumber'],
        ['captcha_output', 'captchaOutput'],
        ['pass_token', 'passToken'],
        ['gen_time', 'genTime']
      ])

      instance.reset()
      resolve(data)
    })

    instance.onClose((err: Any) => {
      reject(err)
    })

    instance.onError((err: Any) => {
      console.error(err)
      reject(new Error(err.msg))
    })
  })
}
