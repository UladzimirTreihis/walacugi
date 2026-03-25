import React, { useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { fetchNews } from "../store/newsSlice";
import NewsShort from "./NewsShort";
import SimpleNews from "./SimpleNews";
import { useTranslation } from "react-i18next";
import type { RootState } from "../store/store";

export default function News() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const news = useSelector((state: RootState) => state.news.items);
  const loading = useSelector((state: RootState) => state.news.loading);
  const error = useSelector((state: RootState) => state.news.error);

  useEffect(() => {
    if (news.length === 0) {
      // @ts-expect-error thunk typing
      dispatch(fetchNews());
    }
  }, [dispatch, news.length]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Container sx={{py: 10}}>
      <Typography variant="h4" gutterBottom align="center">
        {t("news")}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
        {news.length > 0 && (
          <Box sx={{ width: "100%" }}>
            <NewsShort data={news[0]} />
          </Box>
        )}

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
                flex: "1 1 calc(33% - 16px)",
                minWidth: "250px",
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
