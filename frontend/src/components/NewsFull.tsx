import React from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchNews } from "../store/newsSlice";
import { Box, Container, Typography } from "@mui/material";
import ImageGallery from "./shared/ImageGallery";
import DOMPurify from "dompurify";
import type { RootState } from "../store/store";
import { useEffect } from "react";

export default function NewsFull() {
  const { newsId } = useParams<{ newsId: string }>();
  const dispatch = useDispatch();

  const newsList = useSelector((state: RootState) => state.news.items);
  const loading = useSelector((state: RootState) => state.news.loading);
  const error = useSelector((state: RootState) => state.news.error);

  const news = newsList.find((item) => item._id === newsId);

  useEffect(() => {
    if (!news) {
      // @ts-expect-error thunk typing
      dispatch(fetchNews());
    }
  }, [dispatch, news]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!news) return <Typography variant="h6">News not found</Typography>;

  return (
    <Container>
      <Box sx={{ display: "block", textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ my: 4, display: "block" }}>
          {news.title}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <ImageGallery images={news.images} />
        </Box>
      </Box>

      <Box sx={{ my: 4 }}>
        <Typography
          variant="body1"
          sx={{ mt: 2 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.description) }} 
        />
      </Box>
    </Container>
  );
}
