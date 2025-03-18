import React, {useState, useEffect} from "react";
import { Box, Container, Typography } from "@mui/material";
import NewsShort from "./NewsShort";
import SimpleNews from "./SimpleNews";
import { useTranslation } from "react-i18next";
import useApi from "../hooks/useApi"

export default function News() {
    const { t } = useTranslation();
    const { get, loading, error } = useApi();
    const [news, setNews] = useState([]);

    useEffect(() => {
      get("/news")
        .then((data) => setNews(data))
        .catch((err) => console.error("Failed to fetch news", err));
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

  return (
    <Container>
        <Typography variant="h4" gutterBottom align="center">
            {t("news")}
        </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
        
        {/* First News Item - Full Width */}
        {news.length > 0 && (
          <Box sx={{ width: "100%" }}>
            <NewsShort data={news[0]} fullDescription={true} />
          </Box>
        )}

        {/* Other News Items - Flow Below */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "center",
          }}
        >
          {news.slice(1).map((item, index) => (
            <Box
              key={index}
              sx={{
                flex: "1 1 calc(33% - 16px)", // Responsive 3 per row
                minWidth: "250px", // Ensures items don't shrink too much
              }}
            >
              <SimpleNews data={item} />
            </Box>
          ))}
        </Box>

      </Box>
    </Container>
  );
}
