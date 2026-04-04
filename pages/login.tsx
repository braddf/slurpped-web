import React, { FormEvent, useState } from "react";
import useUser from "../lib/useUser";
import Form from "../components/Form";
import fetchJson, { FetchError } from "../lib/fetchJson";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  // here we just check if user is already logged in and redirect to profile
  const { mutateUser } = useUser({
    redirectTo: "/",
    redirectIfFound: true
  });
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // @ts-ignore
    const { email } = event.target;

    try {
      setLoading(true);
      setErrorMsg("");
      const cleanEmail = email.value.toLowerCase().trim().replace(/\s+/g, "");

      const userExists = await fetchJson("/api/userExists/" + cleanEmail, {
        headers: { "Content-Type": "application/json" }
      });
      if (userExists) {
        try {
          const res = await fetch("/api/auth/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, redirect: "/" })
          });
          if (!res.ok) throw new Error("request failed");
          const data = await res.json();
        } catch (e: any) {
          setErrorMsg(e.message);
        }
      } else {
        router.push(
          `/register?email=${cleanEmail}&prevPage=login&returnPage=${router.query.returnPage || ""}`
        );
      }

      setLoading(false);
      setEmailSent(true);
    } catch (error: any) {
      setLoading(false);
      if (error instanceof FetchError) {
        setErrorMsg(error.data.message);
      } else {
        console.error("An unexpected error happened:", error);
      }
    }
  };
  let message: string = "";
  if (router.query.returnPage === "order") {
    message = `Welcome! You'll need to log in or register to order - it only takes a second, promise.`;
  } else if (router.query.prevPage === "register") {
    message = `Welcome back! Looks like you already have an account, so just log in and you're good to go.`;
  }

  return (
    <div>
      <div className="max-w-xs sm:max-w-sm mx-auto mt-24 mb-32">
        {!!message.length && (
          <b className="block mb-8 px-4 py-3 text-center rounded-xl border-2 border-carrot border-dashed">
            {message}
          </b>
        )}
        <h1 className="text-xl font-bold mb-6">Log in</h1>
        {emailSent && (
          <b className="block mb-8 px-4 py-3 text-center rounded-xl border-2 border-carrot border-dashed">
            Login link sent to your email. <br />
            Please check your inbox and follow the link to complete your registration.
          </b>
        )}
        <Form errorMessage={errorMsg} loading={loading} onSubmit={handleSubmit} />
        <div className="flex mt-4">
          <span>Don&apos;t have an account?</span>
          <Link className="ml-1 " href={"/register"}>
            Register here
          </Link>
        </div>
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
