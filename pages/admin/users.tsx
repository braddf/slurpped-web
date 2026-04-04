import { GetServerSideProps } from "next";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import fetchJson from "../../lib/fetchJson";
import { getCookies } from "cookies-next";
import Order from "../../models/Order";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { debounce } from "lodash";
import User from "../../models/User";
import { LoadingSpinner } from "../../components/icons";
import HeaderMenu from "../../components/admin/HeaderMenu";

interface UsersPageProps {
  // users: User[];
}

const UserEditModal: FC<{
  user: User | undefined;
  userSaving: boolean;
  userSavingError: string | undefined;
  onClose: () => void;
  onSave: (user: Omit<User, "email">) => void;
}> = ({ user, userSaving, userSavingError, onClose, onSave }) => {
  const [firstName, setFirstName] = useState(`${user?.firstName}`);
  const [lastName, setLastName] = useState(`${user?.lastName}`);
  const [email, setEmail] = useState(`${user?.email}`);
  const [isAdmin, setIsAdmin] = useState(!!user?.isAdmin);
  console.log("userSavingError", userSavingError);

  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
      <div onClick={onClose} className="fixed inset-0 transition-opacity bg-soil-dark/10"></div>
      <div className="mx-3 bg-white w-96 max-w-full p-4 rounded-3xl z-30">
        <h2 className="pt-1 px-2 pb-3">Edit User</h2>
        <div className="px-2 pb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="firstName">First Name</label>
            <input
              className="text-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="lastName">Last Name</label>
            <input
              className="text-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email">Email (locked)</label>
            <input
              className="text-input bg-newTrowel/50"
              disabled
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <label htmlFor="isAdmin">Is Admin?</label>
            <input
              className="checkbox-input"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
          </div>
        </div>
        {userSavingError && (
          <div className="flex flex-col justify-center rounded-2xl bg-beetroot px-4 py-2 mb-4">
            <span className="block text-white text-center">{userSavingError.split("–")[0]}</span>
            <small className="block text-white text-center">{userSavingError.split("–")[1]}</small>
          </div>
        )}
        <div className="flex justify-between">
          <button className="admin-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="admin-btn-primary"
            disabled={userSaving}
            onClick={() => onSave({ id: user.id, firstName, lastName, isAdmin } as User)}
          >
            {userSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage = ({}: UsersPageProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [headers, setHeaders] = useState<Headers>();
  const [userCount, setUserCount] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<User>();
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [userSavingError, setUserSavingError] = useState<string | undefined>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());

  useEffect(() => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Accept", "application/json");
    headers.append("Cookie", JSON.stringify(getCookies()) || "");
    setHeaders(headers);
  }, []);

  // Debounce the search input changes
  const debounceSearch = useCallback(
    debounce((searchString: string) => {
      setDebouncedSearch(searchString);
    }, 200),
    []
  );

  // Fetch users based on the debounced search string
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const foundUsers: User[] = await fetchJson(
        `/api/admin/search-users?searchString=${debouncedSearch}`,
        {
          headers
        }
      );
      setUsers(foundUsers);
      setIsLoading(false);
    })();
  }, [debouncedSearch, lastUpdatedAt]);

  // Trigger the debounce search whenever the search string changes
  useEffect(() => {
    debounceSearch(search);
  }, [search]);

  // Fetch the total number of users in the database
  useEffect(() => {
    (async () => {
      const userCountInDb: number = await fetchJson(`/api/admin/count-users`, {
        headers
      });
      setUserCount(userCountInDb);
    })();
  }, []);

  const saveUser = async (user: Omit<User, "email">) => {
    setUserSaving(true);
    setUserSavingError(undefined);
    try {
      const updatedUser = await fetchJson(`/api/admin/update-user`, {
        method: "POST",
        headers,
        body: JSON.stringify(user)
      });
      console.log("Updated user", updatedUser);
      setShowUserEditModal(false);
      setLastUpdatedAt(Date.now());
    } catch (error) {
      console.error("Error updating user", error);
      setUserSavingError(
        "Error updating user – please check your connection and try again or contact Brad if still no luck!"
      );
    }
    setSelectedUser(undefined);
    setUserSaving(false);
  };

  return (
    <div className="mx-4 sm:mx-8 mb-24">
      {showUserEditModal && (
        <UserEditModal
          user={selectedUser}
          userSaving={userSaving}
          userSavingError={userSavingError}
          onClose={() => {
            setSelectedUser(undefined);
            setShowUserEditModal(false);
          }}
          onSave={saveUser}
        />
      )}
      <div className="flex justify-between items-center container my-8">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between">
            <h1 className="text-4xl">Users</h1>
            <HeaderMenu />
          </div>
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex flex-initial flex-col w-64 mt-4 xl:mt-9">
              <label htmlFor="search" className="text-sm">
                Search users by name / email:
              </label>
              <input
                type="text"
                placeholder="e.g. Grace Hopper"
                className="mt-1 text-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col relative">
              {isLoading && (
                <div className="absolute bg-rainwater/50 z-20 top-0 left-0 right-0 h-full flex pt-40 justify-center text-center py-4">
                  <div className="sticky top-64 h-1">
                    <LoadingSpinner />
                  </div>
                </div>
              )}
              <span className="self-end mb-2">
                Showing <b>{users.length}</b> of <b>{userCount.toLocaleString()}</b> users
              </span>
              <div className="">
                <div className="grid grid-cols-12 items-center rounded p-1">
                  <div className="col-span-2 px-2">First Name</div>
                  <div className="col-span-3 px-2">Last Name</div>
                  <div className="col-span-5 px-2">Email</div>
                  <div className="col-span-1 px-2 flex justify-center">Role</div>
                  <div className="col-span-1 px-2 flex justify-end">Actions</div>
                </div>
                {users.map((user) => {
                  return (
                    <div
                      key={`UserRow-${user.id}`}
                      className="grid grid-cols-12 items-center rounded even:bg-chickpea p-1"
                    >
                      <div className="col-span-2 px-2 break-words">{user.firstName}</div>
                      <div className="col-span-3 px-2 break-words">{user.lastName}</div>
                      <div className="col-span-5 px-2 break-words">{user.email}</div>
                      <div className="col-span-1 px-2 flex justify-center">
                        {user.isAdmin ? (
                          <span className="border border-mangetout bg-mangetout text-white text-sm px-1 rounded">
                            Admin
                          </span>
                        ) : (
                          <span className="border border-trowel text-trowel text-sm px-1 rounded">
                            User
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 px-2">
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserEditModal(true);
                            }}
                            className="px-2 bg-sweetcorn text-sm text-white rounded"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = withIronSessionSsr(async ({ req }) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", req?.headers.cookie || "");

  return {
    props: {
      // users
    }
  };
}, sessionOptions);

export default UsersPage;
