import React from "react";
import { Card, CardMedia, CardContent, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { useSelector } from "react-redux";


export default function NewsShort({ data, fullDescription }) {
  const { _id, images, title, description } = data;
  const adminToken = useSelector((state) => state.auth.token); 
  const isAdmin = adminToken ? true : false

  const { del } = useApi(); 

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    const response = await del(`/news/${newsId}`, {
      "x-admin-token": adminToken
    });

    if (response) {
      console.log("News deleted successfully");
    } else {
      console.error("Failed to delete news");
    }
  };

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
    {/* Large Image */}
      <CardMedia component="img" image={images[0]} alt={title} sx={{ height: 300, objectFit: "cover" }} />

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="body2" sx={{ flexGrow: 1}}>
          {fullDescription 
          ? description.split("\n\n").map((paragraph, index) => (
            <Typography key={index} variant="body2" paragraph >
                {paragraph}
            </Typography>
          )) 
          : description.slice(0, 100) + "..."}
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
              onClick={() => handleDeleteNews(data._id)}
              >
              Delete
            </Button>
          </>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}
