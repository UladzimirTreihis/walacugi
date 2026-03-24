import React from "react";
import { Card, CardMedia, CardContent, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../store/newsSlice";
import getExcerpt from "../utils/getExcerpt";
import type { RootState } from "../store/store";
import type { NewsItem } from "../types";

export default function NewsShort({ data }: { data: NewsItem }) {
  const { _id, images, title, description } = data;
  const adminToken = useSelector((state: RootState) => state.auth.token); 
  const isAdmin = !!adminToken;
  const dispatch = useDispatch();

  const { del } = useApi(); 

  const handleDeleteNews = async (newsId: string) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    const response = await del(`/news/${newsId}`, {
      "x-admin-token": adminToken ?? ""
    });

    if (response) {
      dispatch(deleteNews(newsId));
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
        transition: "box-shadow 0.3s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "scale(1.02)",
          backgroundColor: "rgba(255, 255, 255, 0.2)"
        },
      }}
    >      
    <CardMedia component="img" image={images[0]} alt={title} sx={{ height: 300, objectFit: "cover" }} />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="body2" sx={{ flexGrow: 1}}>
          {getExcerpt(description)}
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
