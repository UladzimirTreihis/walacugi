import React, { useEffect, useState } from "react";
import { Card, CardMedia, CardContent, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../store/newsSlice";



export default function SimpleNews({ data }) {
  const { _id, images, title } = data;
  const [isPortrait, setIsPortrait] = useState(false);
  const adminToken = useSelector((state) => state.auth.token); 
  const isAdmin = adminToken ? true : false
  const { del } = useApi();
  const dispatch = useDispatch();

  // Delete logic for admin 
  const handleDeleteNews = async (newsId) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    const response = await del(`/news/${newsId}`, {
      "x-admin-token": adminToken
    });

    if (response) {
      console.log("News deleted successfully");
      dispatch(deleteNews(newsId));
    } else {
      console.error("Failed to delete news");
    }
  };
  // Check image dimensions dynamically
  const firstImage = images[0]

  useEffect(() => {
    const img = new Image();
    img.src = firstImage;
    img.onload = () => {
      setIsPortrait(img.height > img.width); // Determine if it's a portrait image
    };
  }, [firstImage]);

  return (
    <Card
      component={Link}
      to={`/news/${_id}`}
      sx={{
        textDecoration: "none",
        borderRadius: 2, 
        boxShadow: 2, 
        display: "block", 
        overflow: "hidden",
        transition: "box-shadow 0.3s ease, transform 0.2s ease", // Smooth transition
        "&:hover": {
          boxShadow: 6, // Increase shadow on hover
          transform: "scale(1.02)", // Slightly enlarge the card
          backgroundColor: "rgba(255, 255, 255, 0.2)"
        },
      }}
    >
      <CardMedia component="img" image={images[0]} alt={title} sx={{ 
        height: isPortrait ? "auto" : 300,
        maxHeight: 400,
        objectFit: isPortrait ? "contain" : "cover",
        justifyContent: "start"
        }} />
      <CardContent>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>{title}</Typography>
      </CardContent>
      {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                to={`/admin/news/edit/${data._id}`}
                sx={{ mt: 1 }}
              >
                Edit
              </Button>
              <Button
              variant="outlined"
              color="error"
              sx={{ mt: 1, ml: 2 }}
              onClick={(e) => {
                e.stopPropagation(); // Prevents the card link from triggering
                e.preventDefault();  // Prevents unwanted navigation
                handleDeleteNews(data._id);
              }}
              >
              Delete
            </Button>
          </>
          )}
    </Card>
  );
}
