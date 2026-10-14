export function focusFirstInvalid(form, errors) {
  if (!Object.keys(errors).length) return

  window.requestAnimationFrame(() => {
    const field = Array.from(form.querySelectorAll('input, select, textarea'))
      .find((input) => Object.hasOwn(errors, input.id) || Object.hasOwn(errors, input.name))
    if (!field) return

    const section = field.closest('.field-group, fieldset') || field
    section.scrollIntoView({ behavior: 'smooth', block: 'center' })
    field.focus({ preventScroll: true })
  })
}
