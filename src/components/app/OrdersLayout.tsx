import { Outlet } from "react-router";
import OrdersNavbar from "./OrdersNavbar";

const OrdersLayout = () => {
  return (
    <main className="min-h-screen">
      <header className="flex flex-col w-full">
        <div className="w-full fixed top-0 bg-white z-10">
          <OrdersNavbar />
        </div>
      </header>
      <div className="w-full p-5 md:px-8  mt-[3.4rem]">
        <Outlet />
      </div>
    </main>
  );
};

export default OrdersLayout;
