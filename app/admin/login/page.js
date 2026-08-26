import Login from "../../../app/admin/components/Login";
import React from 'react'
import { noIndexMetadata } from "@/components/NoIndexRobots";

export const metadata = noIndexMetadata;

const LoginPage = () => {
  return (
    <div>
      <Login />
    </div>
  )
}

export default LoginPage
