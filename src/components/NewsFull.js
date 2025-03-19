import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchNews } from "../store/newsSlice";
import { Box, Container, Typography } from "@mui/material";
import ImageGallery from "./shared/ImageGallery";

export default function NewsFull() {
  const { newsId } = useParams();
  const dispatch = useDispatch();

  // Get news from Redux
  const newsList = useSelector((state) => state.news.items);
  const loading = useSelector((state) => state.news.loading);
  const error = useSelector((state) => state.news.error);

  // Find the specific news article in Redux
  const news = newsList.find((item) => item._id === newsId);

  // Fetch news only if it's not already in Redux
  useEffect(() => {
    if (!news) {
      dispatch(fetchNews());
    }
  }, [dispatch, news]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!news) return <Typography variant="h6">News not found</Typography>;

  return (
    <Container>
      {/* Title */}
      <Box sx={{ display: "block", textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" sx={{ my: 4, display: "block" }}>
          {news.title}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <ImageGallery images={news.images} />
        </Box>
      </Box>

      {/* Description with proper paragraphs */}
      <Box sx={{ my: 4 }}>
        {news.description.split("\n\n").map((paragraph, index) => (
          <Typography key={index} variant="body1" paragraph>
            {paragraph}
          </Typography>
        ))}
      </Box>
    </Container>
  );
}
