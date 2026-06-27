import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Edit from "./pages/Edit";
import Create from "./pages/Create";
import CreateSlideshow from "./pages/CreateSlideshow";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter
      {...(process.env.NODE_ENV === "development"
        ? { basename: "/nasheeds-all-night" }
        : {})}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:id" element={<Edit />} />
          <Route path="/create" element={<Create />} />
          <Route path="/create/nasheed" element={<Create />} />
          <Route path="/create/slideshow" element={<CreateSlideshow />} />
          <Route path="/create/slideshow/:id" element={<CreateSlideshow />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
