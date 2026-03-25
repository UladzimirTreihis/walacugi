import React, { useEffect, useState } from "react";
import { Card, CardMedia, CardContent, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { useSelector, useDispatch } from "react-redux";
import { deleteNews } from "../store/newsSlice";
import type { RootState } from "../store/store";
import type { NewsItem } from "../types";

export default function SimpleNews({ data }: { data: NewsItem }) {
  const { _id, images, title } = data;
  const [isPortrait, setIsPortrait] = useState(false);
  const adminToken = useSelector((state: RootState) => state.auth.token); 
  const isAdmin = !!adminToken
  const { del } = useApi();
  const dispatch = useDispatch();

  const handleDeleteNews = async (newsId: string) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;

    const response = await del(`/news/${newsId}`, {
      "x-admin-token": adminToken ?? ""
    });

    if (response) {
      dispatch(deleteNews(newsId));
    }
  };
  const firstImage = images[0]

  useEffect(() => {
    const img = new Image();
    img.src = firstImage;
    img.onload = () => {
      setIsPortrait(img.height > img.width);
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
        transition: "box-shadow 0.3s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "scale(1.02)",
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
                e.stopPropagation();
                e.preventDefault();
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
