import { FormEvent } from "react";
import { useRouter } from "next/router";

export default function Form({
  errorMessage,
  onSubmit,
  register = false,
  loading
}: {
  errorMessage: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  register?: boolean;
  loading: boolean;
}) {
  const router = useRouter();
  return (
    <form onSubmit={onSubmit}>
      {/*{loading && (*/}
      {/*  <div className="absolute inset-0 bg-white/50">*/}
      {/*    <div className="spinner" />*/}
      {/*  </div>*/}
      {/*)}*/}
      {register && (
        <>
          <label>
            <span className="text-sm">First Name</span>
            <input className="bg-potato" type="text" name="firstName" required />
          </label>
          <label>
            <span className="text-sm">Last Name</span>
            <input className="bg-potato" type="text" name="lastName" required />
          </label>
        </>
      )}
      <label>
        <span className="text-sm">Email Address</span>
        <input
          className="bg-potato"
          type="text"
          name="email"
          defaultValue={router.query.email || ""}
          required
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className={`py-3 px-12 rounded-md bg-mangetout text-white ${loading ? "bg-gray-500" : ""}`}
      >
        {loading ? "Sending Link..." : "Send Login link"}
      </button>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <style jsx>{`
        form,
        label {
          display: flex;
          flex-flow: column;
        }
        label > span {
          //font-weight: 600;
          //font-size: 0.875rem;
        }
        input {
          padding: 8px;
          margin: 0.3rem 0 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .error {
          color: brown;
          margin: 1rem 0 0;
        }
      `}</style>
    </form>
  );
}
