import React, {useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";
import Carousel from "react-material-ui-carousel"; // npm install react-material-ui-carousel
import ImageCarousel from "./shared/ImageCarousel";
import ImageGallery from "./shared/ImageGallery";
import useApi from "../hooks/useApi";

export default function NewsFull() {
  const { newsId } = useParams();
  const {get, error, loading} = useApi();
  const [news, setNews] = useState(null)

  useEffect(() => {
      get(`/news/${newsId}`)
      .then((data) => setNews(data))
      .catch((err) => console.error("Failed to fetch news", err));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;



  if (!news) return <Typography variant="h6">News not found</Typography>;
  console.log(news)

  return (
    <Container>
      {/* Title */}
      <Box sx={{display: "block", textAlign: "center"}}>
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
