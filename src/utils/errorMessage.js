export function errorMessage(err, fallback = 'Something went wrong') {
  const msg = err?.response?.data?.message;
  if (typeof msg === 'string') return msg;
  const errors = err?.response?.data?.errors;
  if (Array.isArray(errors) && errors[0]?.msg) {
    return errors.map((e) => e.msg).join('. ');
  }
  return err?.message || fallback;
}
