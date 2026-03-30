import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Container, Pagination, Stack, Typography } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { fetchNews, setNewsFromCache } from "../store/newsSlice";
import NewsShort from "./NewsShort";
import SimpleNews from "./SimpleNews";
import { useTranslation } from "react-i18next";
import type { AppDispatch, RootState } from "../store/store";

export default function News() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const news = useSelector((state: RootState) => state.news.items);
  const loading = useSelector((state: RootState) => state.news.loading);
  const error = useSelector((state: RootState) => state.news.error);
  const totalPages = useSelector((state: RootState) => state.news.totalPages);
  const pages = useSelector((state: RootState) => state.news.pages);
  const loadingPages = useSelector((state: RootState) => state.news.loadingPages);

  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(1);
  const [animPhase, setAnimPhase] = useState<"idle" | "exiting" | "entering">("idle");
  const currentPageLoading = !!loadingPages[page];

  useEffect(() => {
    if (pages[page]) {
      dispatch(setNewsFromCache(page));
      return;
    }
    dispatch(fetchNews({ page, limit: 4 }));
  }, [dispatch, page, pages]);

  useEffect(() => {
    const nextPage = page + 1;
    if (!totalPages || nextPage > totalPages || pages[nextPage] || loadingPages[nextPage]) return;
    dispatch(fetchNews({ page: nextPage, limit: 4, silent: true }));
  }, [dispatch, page, totalPages, pages, loadingPages]);

  if (error && news.length === 0) return <p>Error: {error}</p>;

  const handlePageChange = (_e: React.ChangeEvent<unknown>, value: number) => {
    if (value === page) return;
    const nextDirection = value > page ? 1 : -1;
    setDirection(nextDirection);
    setAnimPhase("exiting");
    window.setTimeout(() => {
      setPage(value);
      setAnimPhase("entering");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setAnimPhase("idle"));
      });
    }, 180);
  };

  const getTransform = () => {
    if (animPhase === "exiting") return direction > 0 ? "translateX(-80px)" : "translateX(80px)";
    if (animPhase === "entering") return direction > 0 ? "translateX(80px)" : "translateX(-80px)";
    return "translateX(0)";
  };

  const contentOpacity = animPhase === "idle" ? 1 : 0;

  return (
    <Container sx={{py: 10}}>
      <Typography variant="h4" gutterBottom align="center">
        {t("news")}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
        <Box
          key={page}
          sx={{
            transform: getTransform(),
            opacity: contentOpacity,
            transition: "transform 180ms ease-in-out, opacity 180ms ease-in-out",
            willChange: "transform, opacity"
          }}
        >
          {news.length > 0 && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <NewsShort data={news[0]} />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
              minHeight: 420,
            }}
          >
            {news.slice(1).map((item, index) => (
              <Box
                key={index}
                sx={{
                  flex: "1 1 calc(33% - 16px)",
                  minWidth: "250px",
                  height: 420,
                  display: "flex"
                }}
              >
                <SimpleNews data={item} />
              </Box>
            ))}
          </Box>
        </Box>

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ pt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              disabled={animPhase !== "idle"}
              color="primary"
              shape="rounded"
            />
          </Stack>
        )}
        {loading && news.length === 0 && (
          <Stack alignItems="center" sx={{ pt: 1 }}>
            <CircularProgress size={22} />
          </Stack>
        )}
        {currentPageLoading && news.length > 0 && (
          <Stack alignItems="center" sx={{ pt: 1 }}>
            <CircularProgress size={18} />
          </Stack>
        )}
      </Box>
    </Container>
  );
}
