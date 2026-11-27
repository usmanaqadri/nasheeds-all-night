import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Header from "./Header";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }) => children,
  useGoogleLogin: () => jest.fn(),
}));

const Location = () => <output>{useLocation().pathname}</output>;

const click = (element) => act(() => userEvent.click(element));

function openMenu(auth) {
  useAuth.mockReturnValue(auth);
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Header isHome />
      <Location />
    </MemoryRouter>,
  );
  click(screen.getByRole("button", { name: "Main menu" }));
}

test("guests can expand the inline join form and submit a session code", async () => {
  openMenu({ loggedIn: false });
  expect(screen.getByRole("menuitem", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

  click(screen.getByRole("menuitem", { name: "Join live session" }));
  const menu = screen.getByRole("menu");
  const input = within(menu).getByRole("textbox", { name: "Session code" });
  const joinButton = within(menu).getByRole("button", { name: "Join" });
  expect(joinButton).toBeDisabled();
  await waitFor(() => expect(input).toHaveFocus());
  fireEvent.change(input, {
    target: { value: " ABC123 " },
  });
  act(() => userEvent.tab());
  expect(joinButton).toHaveFocus();
  act(() => userEvent.keyboard("{Enter}"));

  expect(screen.getByText("/session/ABC123")).toBeInTheDocument();
});

test("the signed-in menu displays the account above creation actions and sign-out", () => {
  openMenu({
    loggedIn: true,
    user: { name: "Usman Qadri", picture: "/avatar.png" },
  });

  const menu = screen.getByRole("menu");
  expect(screen.getByRole("img", { name: "Usman Qadri" })).toBeInTheDocument();
  expect(screen.getByText("Usman Qadri")).toBeInTheDocument();
  const items = screen.getAllByRole("menuitem");
  expect(items.map((item) => item.textContent)).toEqual([
    "New Nasheed",
    "New Slideshow",
    "New Session",
    "Join live session",
    "Sign out",
  ]);
  expect(items[0]).toHaveFocus();
  expect(menu.firstElementChild).toHaveTextContent("Usman Qadri");
});
