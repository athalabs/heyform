import { FieldKindEnum, FormField, FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

export function isStripeEnabled(form: Any): boolean {
  return helper.isValid(form.stripe?.accountId) && !!getPaymentField(form)
}

export function getPaymentField(form: FormModel): FormField {
  return form.fields.find(f => f.kind === FieldKindEnum.PAYMENT)
}
