import React, { useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { fetchNews } from "../store/newsSlice";
import NewsShort from "./NewsShort";
import SimpleNews from "./SimpleNews";
import { useTranslation } from "react-i18next";

export default function News() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Get news from Redux
  const news = useSelector((state) => state.news.items);
  const loading = useSelector((state) => state.news.loading);
  const error = useSelector((state) => state.news.error);

  // Fetch only if news is empty
  useEffect(() => {
    if (news.length === 0) {
      dispatch(fetchNews());
    }
  }, [dispatch, news.length]);

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
