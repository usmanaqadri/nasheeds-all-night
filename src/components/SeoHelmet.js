import { Helmet } from "react-helmet";

function SeoHelmet({ title, description, url, type = "article" }) {
  const fullTitle = `${title} | Dhikrpedia`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={"https://dhikrpedia.com/banner.jpg"} />
    </Helmet>
  );
}

export default SeoHelmet;
