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

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const Location = () => <output>{useLocation().pathname}</output>;

const click = (element) => act(() => userEvent.click(element));

function openMenu(auth, path = "/") {
  useAuth.mockReturnValue(auth);
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Header isHome={path === "/"} />
      <Location />
    </MemoryRouter>,
  );
  click(screen.getByRole("button", { name: "Main menu" }));
}

test("guests can expand the inline join form and submit a session code", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ foundLiveSession: { isActive: true } }),
  });
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

  expect(await screen.findByText("/session/ABC123")).toBeInTheDocument();
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
    "Host a session",
    "Join live session",
    "Sign out",
  ]);
  expect(items[0]).toHaveFocus();
  expect(menu.firstElementChild).toHaveTextContent("Usman Qadri");
});

test("secondary pages put Home first and retain the creation actions", () => {
  openMenu({ loggedIn: true, user: { name: "Usman Qadri" } }, "/create/nasheed");

  const items = screen.getAllByRole("menuitem");
  expect(items.map((item) => item.textContent)).toEqual([
    "Home",
    "New Nasheed",
    "New Slideshow",
    "Host a session",
    "Join live session",
    "Sign out",
  ]);
  click(items[0]);
  expect(screen.getByText("/")).toBeInTheDocument();
});

test("an incorrect code keeps the menu and join field open on the current page", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  openMenu({ loggedIn: false }, "/create/session");

  click(screen.getByRole("menuitem", { name: "Join live session" }));
  const input = screen.getByRole("textbox", { name: "Session code" });
  fireEvent.change(input, { target: { value: "wrong" } });
  click(screen.getByRole("button", { name: "Join" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("No session with that code.");
  expect(screen.getByRole("menu")).toContainElement(input);
  expect(input).toHaveValue("wrong");
  expect(screen.getByText("/create/session")).toBeInTheDocument();
});
