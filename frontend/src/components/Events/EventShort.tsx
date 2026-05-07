import React from "react";
import { Card, CardMedia, CardContent, Button } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useApi from "../../hooks/useApi";
import { deleteEvent } from "../../store/eventsSlice";
import DOMPurify from "dompurify";
import type { RootState } from "../../store/store";
import type { EventItem } from "../../types";
import ClampedTitle from "../shared/ClampedTitle";
import ClampedHtml from "../shared/ClampedHtml";
import { Box, Chip, Stack } from "@mui/material";
import { COUNTRY_BY_CODE, getFlagEmoji } from "../../constants/countries";
import { useTranslation } from "react-i18next";
import formatDateEU from "../../utils/formatDateEU";
import { addLangToPath } from "../../utils/langUrl";

export default function EventShort({ data }: { data: EventItem }) {
  const { t, i18n } = useTranslation();
  const { _id, images, title, description } = data;
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const dispatch = useDispatch();

  const { del } = useApi();

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    const response = await del(`/events/${eventId}`);

    if (response) {
      dispatch(deleteEvent(eventId));
    }
  };

  const dateTag =
    data.startDate && data.endDate
      ? `${formatDateEU(data.startDate)} - ${formatDateEU(data.endDate)}`
      : data.approxDate || null;

  const hasOverlayTags =
    !!data.location ||
    !!(data.countries && data.countries.length > 0) ||
    !!dateTag;

  return (
    <Card
      sx={{
        width: "100%",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 2,
        "&:hover": {
          boxShadow: 6,
          transform: "scale(1.02)",
          backgroundColor: "transparent"
        }
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Carousel
          navButtonsAlwaysVisible
          autoPlay={false}
          animation="slide"
          indicators={true}
          sx={{
            width: "100%",
            height: 260,
            "& img": {
              objectFit: "cover"
            }
          }}
        >
          {images.map((imgSrc, idx) => (
            <CardMedia
              key={idx}
              component="img"
              image={imgSrc}
              alt={`Event image ${idx}`}
              sx={{ height: "100%", width: "100%" }}
            />
          ))}
        </Carousel>

        {hasOverlayTags && (
          <Box
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              zIndex: 2
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{
                justifyContent: "center"
              }}
            >
              {data.location && (
                <Chip
                  label={`📍 ${data.location}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.85) !important" }}
                />
              )}

              {data.countries?.map((code) => {
                const meta = COUNTRY_BY_CODE[code] ?? null;
                const name = meta?.name ?? code.toUpperCase();
                return (
                  <Chip
                    key={code}
                    label={`${getFlagEmoji(code)} ${name}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.85) !important" }}
                  />
                );
              })}

              {dateTag && (
                <Chip
                  label={`🗓️ ${dateTag}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.85) !important" }}
                />
              )}
            </Stack>
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{mb: "auto"}}>
          <ClampedTitle text={title} lines={2} />
          <ClampedHtml html={DOMPurify.sanitize(description)} lines={4} minHeight="6.2em" />
        </Box>
        <Button
          component={Link}
          to={addLangToPath(`/events/${_id}`, i18n.language)}
          variant="outlined"
          color="primary"
          sx={{
            mt: 5,
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              borderColor: "primary.dark",
              backgroundColor: "transparent",
              color: "primary.dark"
            }
          }}
        >
          {t("read_more")}
        </Button>
        {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                to={addLangToPath(`/admin/events/edit/${data._id}`, i18n.language)}
                sx={{ mt: 1 }}
              >
                Edit
              </Button>
              <Button
              variant="outlined"
              color="error"
              sx={{ mt: 1, ml: 2 }}
              onClick={() => handleDeleteEvent(data._id)}
              >
              Delete
            </Button>
          </>
          )}
      </CardContent>
    </Card>
  );
}
