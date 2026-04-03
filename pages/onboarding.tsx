import React, { FormEvent, useState } from "react";
import useUser from "../lib/useUser";
import Form from "../components/Form";
import fetchJson, { FetchError } from "../lib/fetchJson";
import { Magic } from "magic-sdk";
import { useRouter } from "next/router";

export default function Login() {
  // here we just check if user is already logged in and redirect to profile
  const { mutateUser } = useUser({
    redirectTo: "/",
    redirectIfFound: true
  });
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // @ts-ignore
    const { firstName, lastName, email } = event.target;

    try {
      setLoading(true);
      const newUser = await fetchJson("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value
        })
      });
      setLoading(false);
      // router.push("/");
    } catch (error: any) {
      setLoading(false);
      if (error instanceof FetchError) {
        setErrorMsg(error.data.message);
      } else {
        console.error("An unexpected error happened:", error);
      }
    }
  };

  return (
    <div>
      <div className="max-w-xs sm:max-w-sm mx-auto mt-24">
        <h1 className="text-xl font-bold mb-6">Log in</h1>
        <Form errorMessage={errorMsg} loading={loading} onSubmit={handleSubmit} />
      </div>
      <style jsx>
        {`
          //.login {
          //  max-width: 21rem;
          //  margin: 0 auto;
          //  padding: 1rem;
          //  border: 1px solid #ccc;
          //  border-radius: 4px;
          //}
        `}
      </style>
    </div>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 10 // In seconds
  };
};
