import { CheckRole } from "@/function/server"
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await CheckRole();
  if (!user) {
    redirect('/login'); 
  }
  redirect('/calendar');
}
