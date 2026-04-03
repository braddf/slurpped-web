import React, { useState, useEffect, Dispatch, SetStateAction, useRef, useContext } from "react";
import fetchJson from "../../lib/fetchJson";
import { NextApiResponse, NextPage, NextPageContext } from "next";
import { Stripe } from "stripe";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { useRouter } from "next/router";
import "react-day-picker/dist/style.css";
import useUser from "../../lib/useUser";
import Order, { UnsavedOrder } from "../../models/Order";
import AsyncSelect from "react-select/async";
import {
  formatPrettyDateString,
  get2ndWed,
  get2ndWednesdayString,
  getLastWed,
  getLastWednesdayString,
  getNextOrderDates,
  getNextOrderWed,
  getNextWed,
  getNextWednesdayString
} from "../../helpers/utils";
import { getCookies } from "cookies-next";
import { LoadingSpinner, SmallCarrot } from "../../components/icons";
import {
  blockedMatcher,
  getLocation,
  MultiSelect,
  QuestionSection,
  setCollectionDateFromInput
} from "../order";
import { DayPicker } from "react-day-picker";
import User from "../../models/User";
import { TotalsWidget } from "../../components/admin/TotalsWidget";
import { LegacyTotalsWidget } from "../../components/admin/LegacyTotalsWidget";
import {
  BlockedDate,
  Location,
  OrderItem,
  OrderStatuses,
  SavedUser,
  UnsavedUser
} from "../../types";
import { SettingsContext } from "../_app";
import SidebarButton from "../../components/admin/SidebarButton";
import HeaderMenu from "../../components/admin/HeaderMenu";
import { createClient } from "@sanity/client";

const NEW_ORDER_FORMAT_DATE = new Date("2026-03-28");

type OrderProps = {
  customer: Stripe.Customer;
  invoicesList: Stripe.ApiList<Stripe.Invoice>;
  checkoutSessionsList: Stripe.ApiList<Stripe.Checkout.Session>;
  orders: Order[];
  blockedDates: BlockedDate[];
  locations: Location[];
  upcomingOrderDates: {
    summary: {
      totalOrders: number;
      totalUsers: number;
      totalCollectionDates: number;
      collectionDates: {
        date: string;
        count: number;
        split: {
          [key: string]: number;
        };
      }[];
    };
    orders: Order[];
  };
};

const OrderRow: React.FC<{
  order: Order;
  setOrderCollected: (collected: boolean, orderId: string) => Promise<void>;
  editOrder: (order: Order) => void;
}> = ({ order, setOrderCollected, editOrder }) => {
  const settings = useContext(SettingsContext);
  const getProductName = (slug: string) =>
    settings?.products?.find((p) => p.slug === slug)?.name ?? slug;

  let orderStatusClasses = "";
  let textClasses = "";
  switch (order.status) {
    case "cancelled":
      orderStatusClasses = "bg-black/10";
      textClasses = "text-gray-600 line-through";
      break;
    case "unpaid":
      orderStatusClasses = "bg-rosewater border-beetroot";
      textClasses = "text-beetroot";
      break;
    case "refunded":
      orderStatusClasses = "line-through bg-black/5";
      textClasses = "text-gray-600 line-through";
      break;
  }

  return (
    <>
      <div
        className={`text-sm sm:text-base grid grid-cols-2 gap-3 sm:grid-cols-12 border-t border-gray-400 px-5 py-1 ${orderStatusClasses}`}
      >
        <div className={`col-span-2 sm:col-span-2 self-center ${textClasses}`}>
          {order.user?.fullName}
        </div>
        <div
          className={`col-span-2 sm:col-span-2 self-center ${textClasses}`}
          title={order.product}
        >
          {order.items?.length ? (
            <div className="flex flex-col gap-0.5">
              {order.items.map((item) => (
                <span key={item.slug} className="block">
                  {item.quantity}× {getProductName(item.slug)}
                </span>
              ))}
            </div>
          ) : (
            order.product
          )}
        </div>
        <div className={`sm:text-center self-center ${textClasses}`}>
          {order.items?.length ? order.items.reduce((s, i) => s + i.quantity, 0) : order.quantity}
        </div>
        <div className={`sm:col-span-2 sm:text-center self-center ${textClasses}`}>
          {order.paidAt
            ? new Date(Number(order.paidAt) * 1000).toLocaleString()
            : new Date(order.createdAt).toLocaleString()}
        </div>
        <div className={`text-right self-center ${textClasses}`}>{order.orderType}</div>
        <div className={`text-right self-center ${textClasses}`}>
          {(Number(order.total) / 100).toLocaleString("nl-nl", {
            style: "currency",
            currency: "EUR"
          })}
        </div>
        <div className={`text-center self-center -mr-6 text-sm ${textClasses}`}>{order.status}</div>
        <div className={`text-center self-center -mr-6 ${textClasses}`}>
          {order.collected ? (
            <span
              className="cursor-pointer h-4 text-2xl px-4 py-1"
              onClick={() => setOrderCollected(false, order.id)}
            >
              ✅
            </span>
          ) : (
            <span
              className="cursor-pointer h-4 text-2xl px-4 py-1"
              onClick={() => setOrderCollected(true, order.id)}
            >
              &times;
            </span>
          )}
        </div>
        <div
          className={`text-left self-center text-sm pl-3 cursor-pointer -scale-x-100 opacity-25 hover:opacity-100 px-4 py-1 ${textClasses}`}
          onClick={() => editOrder(order)}
        >
          ✎
        </div>
      </div>
      {order.notes && (
        <div className="text-sm sm:text-base flex gap-3 border-t border-gray-400 px-8 py-1">
          <span className="flex-initial">↪</span>
          <div className="flex-1 self-center text-gray-500">{order.notes}</div>
        </div>
      )}
    </>
  );
};

const loadOptions = async (inputValue: string, callback: (options: any[]) => void) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", JSON.stringify(getCookies()) || "");
  const users: User[] = await fetchJson(`/api/admin/search-users?searchString=${inputValue}`, {
    headers
  });
  return users.map((user) => ({
    label: user.fullName + " (" + user.email + ")",
    value: user
  }));
};

const saveOrder = async (
  user: SavedUser | UnsavedUser | null,
  order: UnsavedOrder | Order,
  setShowOrderModal: Dispatch<SetStateAction<boolean>>,
  setIsSaving: Dispatch<SetStateAction<boolean>>,
  setErrorMessage: Dispatch<SetStateAction<string | null>>,
  refreshList: () => void,
  selectedOrder?: Order
) => {
  try {
    if (!user) throw new Error("No user");
    let newUser = user;
    setIsSaving(true);
    setErrorMessage(null);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Accept", "application/json");
    headers.append("Cookie", JSON.stringify(getCookies()) || "");

    const userExists = await fetchJson(`/api/userExists/${user.email.toLowerCase()}`, {
      headers
    });

    if (userExists) {
      const matchingUsers: User[] = await fetchJson(
        "api/admin/search-users?searchString=" + user.email.toLowerCase(),
        {
          headers
        }
      );
      newUser = matchingUsers[0];
    } else if (!user.hasOwnProperty("id")) {
      newUser = await fetchJson(`/api/register`, {
        method: "POST",
        headers,
        body: JSON.stringify(user)
      });
    }
    if (!newUser.hasOwnProperty("id")) throw new Error("User has no id");

    let newOrder = order;
    if ("id" in newUser) {
      newOrder = { ...order, userId: newUser.id };
    }
    if (selectedOrder) newOrder = { ...newOrder, id: selectedOrder.id };
    if (!newOrder.hasOwnProperty("userId")) throw new Error("Order has no userId");

    await fetchJson(`/api/admin/${selectedOrder ? "update" : "new"}-order`, {
      method: "POST",
      headers,
      body: JSON.stringify(newOrder)
    });
    refreshList();
    setIsSaving(false);
    setShowOrderModal(false);
  } catch (error: any) {
    console.error(error);
    setErrorMessage(error?.message);
    setIsSaving(false);
  }
};

const OrderModal: React.FC<{
  setShowOrderModal: Dispatch<SetStateAction<boolean>>;
  refreshList: () => void;
  selectedOrder?: Order;
  locations: Location[];
}> = ({ setShowOrderModal, refreshList, selectedOrder, locations }) => {
  const collectionPoints = locations.map((location) => location.name);
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string | undefined>(
    "Educatorium"
  );
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([
    { slug: "groentetas", quantity: 1 }
  ]);
  const [collectionDate, setCollectionDate] = useState<Date>();
  const [dateInPast, setDateInPast] = useState<boolean>(false);

  // New order stuff
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [newUser, setNewUser] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [status, setStatus] = useState<OrderStatuses>("unpaid");
  const [orderNotes, setOrderNotes] = useState<string>();
  const [userAlreadyExists, setUserAlreadyExists] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generalSettingsContext = useContext(SettingsContext);
  const allAdminProducts = (generalSettingsContext?.products || []).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const total =
    selectedItems.reduce((sum, item) => {
      const product = allAdminProducts.find((p) => p.slug === item.slug);
      return sum + item.quantity * (product?.priceInCents ?? 0);
    }, 0) / 100;

  useEffect(() => {
    if (email.length && email.includes("@") && email.includes(".")) {
      (async () => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Accept", "application/json");
        headers.append("Cookie", JSON.stringify(getCookies()) || "");

        const userExists = await fetchJson(`/api/userExists/${email}`, {
          headers
        });
        setUserAlreadyExists(!!userExists);
      })();
    } else {
      setUserAlreadyExists(false);
    }
  }, [email]);

  useEffect(() => {
    if (selectedOrder?.user) {
      setFirstName(selectedOrder.user.firstName);
      setLastName(selectedOrder.user.lastName);
      setEmail(selectedOrder.user.email);
      setSelectedUser(selectedOrder.user);
      setSelectedCollectionPoint(selectedOrder.collectionLocation.split(" ")[0]);
      setSelectedItems(
        selectedOrder.items?.length
          ? selectedOrder.items
          : [{ slug: selectedOrder.product, quantity: selectedOrder.quantity }]
      );
      setCollectionDate(new Date(selectedOrder.collectionDate * 1000));
      setStatus(selectedOrder.status);
      setOrderNotes(selectedOrder.notes);
    }
  }, [selectedOrder]);

  const toggleProduct = (slug: string) => {
    setSelectedItems((prev) => {
      if (prev.find((i) => i.slug === slug)) return prev.filter((i) => i.slug !== slug);
      return [...prev, { slug, quantity: 1 }];
    });
  };

  const setItemQuantity = (slug: string, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.slug !== slug));
      return;
    }
    setSelectedItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, quantity: qty } : i)));
  };

  type SelectUser = { label: string; value: User };
  const setUser: (newValue: SelectUser | null) => void = (newValue) => {
    if (!newValue) return;

    const user = newValue.value;
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setSelectedUser(user);
  };
  const buildUser = () => ({
    firstName,
    lastName,
    email
  });
  const buildOrder = () =>
    ({
      collectionLocation: selectedCollectionPoint,
      collectionDate: collectionDate?.getTime() ? collectionDate?.getTime() / 1000 : undefined,
      quantity: selectedItems.reduce((s, i) => s + i.quantity, 0),
      product: selectedItems
        .map((i) => allAdminProducts.find((p) => p.slug === i.slug)?.name ?? i.slug)
        .join(" + "),
      items: selectedItems,
      total: total * 100,
      status,
      notes: orderNotes,
      userId: selectedUser?.id || ""
    } as UnsavedOrder);

  let saveButtonText = isSaving ? "Saving..." : "Save";
  const buttonDisabled =
    isSaving || (!newUser && !selectedUser) || !(firstName && lastName && email);
  if ((!newUser && !selectedUser) || !(firstName && lastName && email))
    saveButtonText = "Enter Customer Details";

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto m-8">
      <div
        onClick={() => setShowOrderModal(false)}
        className="fixed inset-0 transition-opacity bg-soil-dark/10"
      ></div>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="z-30 flex-initial p-6 rounded-md bg-potato shadow-xl sm:text-sm border-gray-300 rounded-md">
          <div className="flex-1 flex flex-col inline-block align-bottom rounded-lg text-left overflow-hidden transform transition-all">
            <h3 className="text-underline-primary mb-4 text-2xl font-bold text-center">
              {selectedOrder ? "Edit" : "New"} Order
            </h3>

            {/* USER */}
            <div className="flex-1 flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="flex flex-1 flex-col">
                {!selectedOrder && (
                  <div className="flex flex-1">
                    <div className="flex flex-1 flex-col">
                      <h3 className="text-lg font-bold mb-2">Search User by Name/Email</h3>
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex flex-col mr-4 mb-4 w-72">
                          <AsyncSelect
                            value={
                              !!selectedUser
                                ? {
                                    label: `${selectedUser.fullName} (${selectedUser.email})`,
                                    value: selectedUser
                                  }
                                : null
                            }
                            isDisabled={newUser}
                            loadOptions={loadOptions}
                            onChange={setUser}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="self-center justify-self-center pt-4">OR</span>
                    <div className="flex flex-1 flex-col mx-4">
                      <h3 className="text-lg font-bold mb-2">Create New User</h3>
                      <span
                        className="cursor-pointer my-2"
                        onClick={() => {
                          if (!newUser) {
                            setFirstName("");
                            setLastName("");
                            setEmail("");
                            setSelectedUser(null);
                          }
                          setNewUser(!newUser);
                        }}
                      >
                        {newUser ? "✅" : "⬜️"}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row flex-1">
                  <div className="flex flex-1 flex-col mr-4">
                    <label className="text-sm font-bold mb-1">First Name</label>
                    <input
                      className="border border-gray-300 rounded-md p-2"
                      type="text"
                      onChange={(e) => setFirstName(e.target.value)}
                      value={firstName}
                      disabled={!newUser}
                    />
                  </div>
                  <div className="flex flex-1 flex-col mr-4">
                    <label className="text-sm font-bold mb-1">Last Name</label>
                    <input
                      className="border border-gray-300 rounded-md p-2"
                      type="text"
                      onChange={(e) => setLastName(e.target.value)}
                      value={lastName}
                      disabled={!newUser}
                    />
                  </div>
                  <div className="flex flex-[2] flex-col">
                    <label className="text-sm font-bold mb-1">
                      Email
                      {userAlreadyExists && !selectedUser && (
                        <small className="text-red-500 font-light">&nbsp;[Existing User]</small>
                      )}
                    </label>
                    <input
                      className={
                        `border border-gray-300 rounded-md p-2` +
                        (userAlreadyExists && !selectedUser
                          ? " border-red-500 outline-red-500"
                          : "")
                      }
                      type="email"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      disabled={!newUser}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCTS */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Products</h3>
              <div className="grid grid-cols-2 gap-3">
                {allAdminProducts.map((product) => {
                  const item = selectedItems.find((i) => i.slug === product.slug);
                  const isSelected = !!item;
                  return (
                    <div
                      key={product.slug}
                      className={`flex items-center justify-between border-2 rounded-md p-3 cursor-pointer transition-colors ${
                        isSelected ? "border-green-700 bg-green-50" : "border-gray-300"
                      }`}
                      onClick={() => toggleProduct(product.slug)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{product.name}</span>
                        <span className="text-xs text-gray-500">
                          €{(product.priceInCents / 100).toFixed(2)}
                        </span>
                      </div>
                      {isSelected && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-6 h-6 border border-green-700 rounded text-green-700 font-bold flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors"
                            onClick={() => setItemQuantity(product.slug, (item?.quantity ?? 1) - 1)}
                          >
                            –
                          </button>
                          <span className="w-5 text-center text-sm font-bold">
                            {item?.quantity}
                          </span>
                          <button
                            className="w-6 h-6 border border-green-700 rounded text-green-700 font-bold flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors"
                            onClick={() => setItemQuantity(product.slug, (item?.quantity ?? 1) + 1)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLLECTION POINT */}
            <QuestionSection text="Collect from:">
              {collectionPoints.map((point) => {
                const location = getLocation(locations, point);
                return (
                  <MultiSelect
                    admin={true}
                    key={point}
                    item={point}
                    label={
                      location ? (
                        <div>
                          {point}
                          <br />
                          <small className="text-base">
                            {location.availableFrom} - {location.availableTo}
                          </small>
                        </div>
                      ) : (
                        point
                      )
                    }
                    selectedItem={selectedCollectionPoint}
                    setSelectedItem={setSelectedCollectionPoint}
                  />
                );
              })}
            </QuestionSection>

            {/* COLLECTION DATE */}
            <QuestionSection text="Collection Date:">
              <div className="flex-1 mx-auto">
                <DayPicker
                  mode="single"
                  className=""
                  selected={collectionDate}
                  // fromDate={getNextOrderWed()}
                  disabled={(day) => blockedMatcher(day, [], selectedCollectionPoint, locations)}
                  required={true}
                  onSelect={(date) =>
                    setCollectionDateFromInput(
                      setCollectionDate,
                      date as Date,
                      collectionDate,
                      setSelectedCollectionPoint,
                      setDateInPast
                    )
                  }
                  modifiersClassNames={{
                    selected: "!bg-green-800 !text-white",
                    hover: "!bg-green-300 !text-white"
                  }}
                />
                {dateInPast && (
                  <span className="block text-beetroot font-bold text-center">
                    Date is in past - is this intentional?
                  </span>
                )}
              </div>
            </QuestionSection>
            <label htmlFor="status" className="flex flex-col text-2xl font-bold mb-5">
              <span className="mb-3">Status</span>
              <select
                name="status"
                className="text-sm bg-white font-normal border border-gray-300 rounded-md p-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatuses)}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>

            {/* ORDER NOTES */}
            <QuestionSection text="Order Notes:">
              <textarea
                className="flex-1 bg-white max-w-full w-[32rem] xl:w-[36rem] p-2 border-2 border-chickpea focus:outline-mangetout rounded-md"
                placeholder="Anything else we should know?"
                rows={4}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </QuestionSection>
            {errorMessage && (
              <div className="flex flex-row justify-end gap-3">
                <span className="text-beetroot flex-1 text-center py-2 px-3 border border-beetroot rounded-md">
                  {errorMessage}
                </span>
              </div>
            )}
            <div className="flex flex-row justify-end gap-4">
              <button
                className="flex-1 border-gray-300 border-2 rounded-md px-6 py-3 mt-4"
                disabled={isSaving}
                onClick={() => setShowOrderModal(false)}
              >
                Cancel
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1 bg-green-800 text-white rounded-md px-6 py-3 mt-4${
                  buttonDisabled ? " opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={buttonDisabled}
                onClick={() =>
                  saveOrder(
                    newUser ? buildUser() : selectedUser,
                    buildOrder(),
                    setShowOrderModal,
                    setIsSaving,
                    setErrorMessage,
                    refreshList,
                    selectedOrder
                  )
                }
              >
                {saveButtonText}
                {isSaving && (
                  <span className="block float-right scale-75">
                    <SmallCarrot className="animate-spin h-6 w-8" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LocationOrderTable: React.FC<{
  title: string;
  orders: Order[];
  showCancelled: boolean;
  setShowCancelled: Dispatch<SetStateAction<boolean>>;
  setOrderCollected: (collected: boolean, orderId: string) => Promise<void>;
  editOrder: (order: Order) => void;
}> = ({ title, orders, showCancelled, setShowCancelled, setOrderCollected, editOrder }) => {
  if (!orders || orders.length === 0) {
    return null;
  }
  return (
    <div className="relative">
      <div className="px-5 py-2 flex items-center sticky top-20 bg-rainwater justify-between">
        <h5 className="">
          {title}{" "}
          <span className="ml-2 px-3 py-1 text-sm font-normal rounded-full bg-chickpea">
            {orders.length}
          </span>
        </h5>
        <div className="flex items-center">
          <label className="flex items-center">
            <span className="mr-2 text-xs">Show cancelled</span>
            <input
              type="checkbox"
              className="accent-sweetcorn h-5 w-5 text-sweetcorn"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
            />
          </label>
        </div>
      </div>
      {orders.map((order) => {
        if (!showCancelled && order.status === "cancelled") return null;

        return (
          <OrderRow
            key={order.id}
            order={order}
            setOrderCollected={setOrderCollected}
            editOrder={editOrder}
          />
        );
      })}
    </div>
  );
};

const ProductDisplay: NextPage<OrderProps> = ({ blockedDates, locations, upcomingOrderDates }) => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/login" });

  // const today = new Date();
  // const nextWednesday = getNextWed(blockedDates);
  // const next2ndWednesday = get2ndWed(blockedDates);
  // const lastWednesday = getLastWed(blockedDates);

  const [clientSideOrders, setClientSideOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(upcomingOrderDates?.summary.collectionDates?.[0]?.date || new Date())
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [showCancelled, setShowCancelled] = useState<boolean>(false);

  const setOrderCollected = async (collected: boolean, orderId: string) => {
    const res = await fetchJson("/api/admin/set-order-collected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collected, orderId })
    });
    refreshList();
  };

  const editOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  useEffect(() => {
    if (!showOrderModal) {
      setSelectedOrder(undefined);
    }
  }, [showOrderModal]);

  const refreshList = () => {
    console.log("refreshing list");
    setLastRefresh(new Date());
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");
      headers.append("Cookie", JSON.stringify(getCookies()) || "");
      const clientSideOrders: Order[] = await fetchJson(
        `/api/admin/get-orders?collectionDate=${selectedDate.getTime()}`,
        { headers }
      );
      setClientSideOrders(clientSideOrders);
      setIsLoading(false);
    })();
  }, [selectedDate, lastRefresh]);

  const educatoriumOrders = clientSideOrders.filter((o) =>
    o.collectionLocation.toLowerCase().includes("educatorium")
  );
  const parnassosOrders = clientSideOrders.filter((o) =>
    o.collectionLocation.toLowerCase().includes("parnassos")
  );
  const vmaOrders = clientSideOrders.filter((o) =>
    o.collectionLocation.toLowerCase().includes("vening")
  );

  if (!user?.isLoggedIn || !user?.isAdmin) return null;

  const userEmails = clientSideOrders
    .map((o) => o.user?.email)
    .filter((e: string | undefined): e is string => !!e);
  const parnassosEmails = parnassosOrders
    .map((o) => o.user?.email)
    .filter((e: string | undefined): e is string => !!e);
  const educatoriumEmails = educatoriumOrders
    .map((o) => o.user?.email)
    .filter((e: string | undefined): e is string => !!e);
  const uniqueEmails = [...new Set(userEmails)];
  const uniqueParnassosEmails = [...new Set(parnassosEmails)];
  const uniqueEducatoriumEmails = [...new Set(educatoriumEmails)];
  const copyEmails = (emails: string[]) => {
    console.log("copying emails");
    navigator.clipboard.writeText(emails.join("\r\n"));
  };

  const isCustomDate = !upcomingOrderDates?.summary.collectionDates
    ?.map((date) => date.date)
    .includes(selectedDate.toISOString().split("T")[0]);

  return (
    <div className="mx-4 sm:mx-8 mb-24">
      {showOrderModal && (
        <OrderModal
          setShowOrderModal={setShowOrderModal}
          refreshList={refreshList}
          selectedOrder={selectedOrder}
          locations={locations}
        />
      )}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-initial flex flex-col justify-center">
          {/* Welcome */}
          <h2 className="mt-8">Welcome back, {user?.firstName}</h2>

          {/* Sidebar */}
          <div className="flex-initial flex flex-col gap-1 p-1 bg-potato border-2 border-sweetcorn rounded-lg mt-4">
            <small className="text-xs pt-1 px-2 pb-0">Collection Dates</small>
            <div className="flex gap-1 min-h-[2.5rem]">
              {upcomingOrderDates?.summary.collectionDates.map((date) => {
                return (
                  <SidebarButton
                    key={date.date}
                    small={Object.keys(date.split)
                      .sort()
                      .map((loc) => loc.slice(0, 3))
                      .join(" + ")
                      .toUpperCase()}
                    text={formatPrettyDateString(new Date(date.date))}
                    onClick={() => {
                      setSelectedDate(new Date(date.date));
                    }}
                    selected={selectedDate.toDateString() === new Date(date.date).toDateString()}
                  />
                );
              })}
              {/*  Calender icon */}
              <input
                id={"CustomDate"}
                type="date"
                className="w-0 m-0 p-0 opacity-0"
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
              <button
                className={` rounded-md flex items-start flex-col py-1 px-3 hover:bg-chickpea !no-underline justify-center relative ${
                  isCustomDate ? "bg-chickpea" : "bg-none"
                }`}
                onClick={() => {
                  const input: HTMLInputElement | null = document.querySelector("#CustomDate");
                  if ("showPicker" in HTMLInputElement.prototype) {
                    // showPicker() is supported.
                    input?.showPicker();
                  }
                  console.log("clicked", input);
                }}
              >
                <small className="text-xs pt-1">Custom Date</small>
                <span>{isCustomDate ? formatPrettyDateString(selectedDate) : "Select..."}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-initial flex flex-col items-end justify-end mt-8">
          {/* Header Menu */}
          <HeaderMenu />

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              className="flex flex-row items-center justify-center text-sm gap-2 px-4 py-2 bg-sweetcorn border-2 border-sweetcorn rounded-lg"
              onClick={() => {
                setShowOrderModal(true);
              }}
            >
              Add New Order
            </button>
            <button
              className="flex-initial block text-soil h-12 p-2 relative"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {/* Three dots menu icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="5" r="1" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="19" r="1" stroke="currentColor" strokeWidth="2" />
              </svg>
              <ul
                className={`absolute right-0 top-full drop-shadow-lg bg-potato border border-sweetcorn rounded-md ${
                  showDropdown ? "" : "hidden"
                }`}
              >
                <li className="flex flex-col items-start px-4 py-3 text-left whitespace-nowrap">
                  <button onClick={() => copyEmails(uniqueEmails)}>Copy All Emails</button>
                  <button
                    className="pt-3 border-t border-sweetcorn mt-3"
                    onClick={() => copyEmails(uniqueParnassosEmails)}
                  >
                    Copy Parnassos Emails
                  </button>
                  <button
                    className="pt-3 border-t border-sweetcorn mt-3"
                    onClick={() => copyEmails(uniqueEducatoriumEmails)}
                  >
                    Copy Educatorium Emails
                  </button>
                </li>
              </ul>
            </button>
          </div>
        </div>
      </div>

      {/* Widgets */}
      <div className="flex mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {selectedDate < NEW_ORDER_FORMAT_DATE ? (
            <>
              <LegacyTotalsWidget title={"Parnassos"} orders={parnassosOrders} />
              <LegacyTotalsWidget title={"Educatorium"} orders={educatoriumOrders} />
              <LegacyTotalsWidget title={"VMA"} orders={vmaOrders} />
              <LegacyTotalsWidget title={"Total"} orders={clientSideOrders} />
            </>
          ) : (
            <>
              <TotalsWidget title={"Parnassos"} orders={parnassosOrders} />
              <TotalsWidget title={"Educatorium"} orders={educatoriumOrders} />
              <TotalsWidget title={"VMA"} orders={vmaOrders} />
              <TotalsWidget title={"Total"} orders={clientSideOrders} />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {/* ORDERS TABLE */}
        <div className="flex flex-1 flex-col mb-6">
          <div className="flex flex-col flex-1 relative">
            <div className="sticky z-10 top-14 text-sm bg-rainwater grid-cols-12 sm:grid px-5 font-bold pb-2">
              <div className="sm:col-span-2 h-6">Name</div>
              <div className="sm:col-span-2 h-6">Product</div>
              <div className="h-6 text-center">Quantity</div>
              <div className="sm:col-span-2 h-6 text-center">Ordered on</div>
              <div className="text-right pr-2 h-6">Source</div>
              <div className="text-right pr-2 h-6">Total</div>
              <div className="text-center -mr-6 h-6">Status</div>
              <div className="text-right -mr-4 h-6">Collected</div>
              <div className="text-right h-6">Edit</div>
            </div>
            {isLoading && (
              <div className="absolute bg-rainwater/50 z-20 top-0 left-0 right-0 h-full flex pt-40 justify-center text-center py-4">
                <div className="sticky top-64 h-1">
                  <LoadingSpinner />
                </div>
              </div>
            )}
            <LocationOrderTable
              title="Educatorium"
              orders={educatoriumOrders}
              editOrder={editOrder}
              showCancelled={showCancelled}
              setShowCancelled={setShowCancelled}
              setOrderCollected={setOrderCollected}
            />
            <LocationOrderTable
              title="Parnassos"
              orders={parnassosOrders}
              editOrder={editOrder}
              showCancelled={showCancelled}
              setShowCancelled={setShowCancelled}
              setOrderCollected={setOrderCollected}
            />
            <LocationOrderTable
              title="VMA"
              orders={vmaOrders}
              editOrder={editOrder}
              showCancelled={showCancelled}
              setShowCancelled={setShowCancelled}
              setOrderCollected={setOrderCollected}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
  if (!req.session.user?.isLoggedIn)
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  if (!req.session.user.isAdmin)
    return {
      redirect: {
        destination: "/",
        permanent: false
      }
    };

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", req?.headers.cookie || "");

  const blockedDates = await fetchJson(`${process.env.APP_URL}/api/get-blocked-dates`, {
    headers
  });

  let upcomingOrderDates: Order[] = [];
  try {
    upcomingOrderDates = await getNextOrderDates();
  } catch (error) {
    console.error("Error fetching upcoming order dates:", error);
    // throw new Error("Failed to fetch upcoming order dates");
  }

  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN,
    useCdn: false
  });
  const language = getCookies({ req, res })["groentetas/lang"] || "en-gb";

  const query = `*[_type == "location" &&  __i18n_lang == "${language}" && !(_id in path('drafts.**'))]`;
  const locations = await client.fetch(query);

  return {
    props: {
      user: req.session.user,
      blockedDates,
      locations,
      upcomingOrderDates
    }
  };
}, sessionOptions);

export default ProductDisplay;
