import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import EnterCodeForm from './EnterCodeForm'

export default async function EnterCodePage() {
  const cookieStore = await cookies()
  if (cookieStore.has('ajflix_access')) {
    redirect('/')
  }

  return <EnterCodeForm />
}
