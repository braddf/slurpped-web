import React, { FormEvent, useState } from "react";
import useUser from "../lib/useUser";
import Form from "../components/Form";
import fetchJson, { FetchError } from "../lib/fetchJson";
import { useRouter } from "next/router";

export default function Register() {
  // here we just check if user is already logged in and redirect to profile
  const router = useRouter();
  const { mutateUser } = useUser({
    redirectTo: !!router.query.returnPage ? `/${router.query.returnPage || ""}` : "/",
    redirectIfFound: true
  });

  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // @ts-ignore
    const { firstName, lastName, email } = event.target;

    const cleanEmail = email.value.toLowerCase().trim().replace(/\s+/g, "");
    try {
      setLoading(true);
      const newUser: any = await fetchJson("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.value,
          lastName: lastName.value,
          email: cleanEmail
        })
      });

      try {
        const res = await fetch("/api/auth/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, redirect: "/" })
        });
        if (!res.ok) throw new Error("request failed");
        const data = await res.json();
        setEmailSent(true);
      } catch (e: any) {
        setErrorMsg(e.message);
      }

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      if (error instanceof FetchError) {
        setErrorMsg(error.data.message);
        console.log("newUser", error);
        if (error.data.message === "User already exists") {
          router.push(`/login?email=${cleanEmail}&prevPage=register`);
        }
      } else {
        console.error("An unexpected error happened:", error);
      }
    }
  };
  let message: string = "";
  if (router.query.prevPage === "login") {
    message = `Looks like you're new here, just need to know what to call you and we're good to go.`;
  }

  if (emailSent) {
    return (
      <div>
        <div className="max-w-xs sm:max-w-sm mx-auto mt-24 mb-32">
          <h1 className="text-5xl text-soil mb-1">Sign Up</h1>
          <b className="block mb-8 px-4 py-3 text-center rounded-xl border-2 border-carrot border-dashed">
            Login link sent to your email. <br />
            Please check your inbox and follow the link to complete your registration.
          </b>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-xs sm:max-w-sm mx-auto mt-24 mb-32">
        {!!message.length && (
          <b className="block mb-8 px-4 py-3 text-center rounded-xl border-2 border-carrot border-dashed">
            {message}
          </b>
        )}
        <h1 className="text-5xl text-soil mb-1">Sign Up</h1>
        {(!emailSent && (
          <Form errorMessage={errorMsg} register loading={loading} onSubmit={handleSubmit} />
        )) || (
          <b className="block mb-8 px-4 py-3 text-center rounded-xl border-2 border-carrot border-dashed">
            Link sent!
          </b>
        )}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 10 // In seconds
  };
};
