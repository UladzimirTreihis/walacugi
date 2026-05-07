import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchNews } from "../../store/newsSlice";
import { Box, Container, Typography } from "@mui/material";
import ImageGallery from "../shared/ImageGallery";
import DOMPurify from "dompurify";
import type { AppDispatch, RootState } from "../../store/store";
import { useEffect, useState } from "react";
import useApi from "../../hooks/useApi";
import type { NewsItem } from "../../types";
import { useTranslation } from "react-i18next";

export default function NewsFull() {
  const { i18n } = useTranslation();
  const { newsId } = useParams<{ newsId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { get } = useApi();
  const [fetched, setFetched] = useState<NewsItem | null>(null);

  const newsList = useSelector((state: RootState) => state.news.items);
  const loading = useSelector((state: RootState) => state.news.loading);
  const error = useSelector((state: RootState) => state.news.error);

  const news = newsList.find((item) => item._id === newsId) ?? fetched;

  useEffect(() => {
    if (!news) {
      void dispatch(fetchNews({ page: 1, limit: 4, lang: i18n.language }));
      get(`/news/${newsId}`)
        .then((data) => {
          if (data) setFetched(data as NewsItem);
        })
        .catch(() => undefined);
    }
  }, [dispatch, news, newsId, get, i18n.language]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!news) return <Typography variant="h6">News not found</Typography>;

  return (
    <Container sx={{ py: 10 }}>
      <Box sx={{ display: "block", textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, display: "block" }}>
          {news.title}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <ImageGallery images={news.images} />
        </Box>
      </Box>

      <Box sx={{ my: 20 }}>
        <Typography
          variant="body1"
          sx={{ mt: 2 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.description) }}
        />
      </Box>
    </Container>
  );
}
