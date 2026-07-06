import React, { useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sanitizeAboutHtml } from "../../utils/sanitizeHtml";
import { addLangToPath } from "../../utils/langUrl";
import { FOUNDATION_FACTS } from "./foundationFacts";

type FormalRow = { label: string; value: string; href?: string };

function FormalDataRow({ label, value, href }: FormalRow) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 0.5, sm: 2 },
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: 0 }
      }}
    >
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ minWidth: { sm: 180 }, flexShrink: 0 }}
      >
        {label}
      </Typography>
      {href ? (
        <Link href={href} underline="hover" sx={{ wordBreak: "break-word" }}>
          {value}
        </Link>
      ) : (
        <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
          {value}
        </Typography>
      )}
    </Box>
  );
}

export default function PoznajSwiatPage() {
  const { t, i18n } = useTranslation();

  const activityItems = t("poznajSwiat.activities.items", { returnObjects: true }) as string[];

  const missionHtml = useMemo(() => sanitizeAboutHtml(t("poznajSwiat.mission.body")), [t]);
  const cooperationHtml = useMemo(
    () => sanitizeAboutHtml(t("poznajSwiat.cooperation.body")),
    [t]
  );

  useEffect(() => {
    document.title = t("poznajSwiat.pageTitle");
  }, [t, i18n.language]);

  const formalRows: FormalRow[] = [
    { label: t("poznajSwiat.formal.labels.fullName"), value: FOUNDATION_FACTS.fullName },
    { label: t("poznajSwiat.formal.labels.legalForm"), value: FOUNDATION_FACTS.legalForm },
    { label: t("poznajSwiat.formal.labels.krs"), value: FOUNDATION_FACTS.krs },
    { label: t("poznajSwiat.formal.labels.nip"), value: FOUNDATION_FACTS.nip },
    { label: t("poznajSwiat.formal.labels.regon"), value: FOUNDATION_FACTS.regon },
    { label: t("poznajSwiat.formal.labels.address"), value: FOUNDATION_FACTS.address },
    {
      label: t("poznajSwiat.formal.labels.email"),
      value: FOUNDATION_FACTS.email,
      href: `mailto:${FOUNDATION_FACTS.email}`
    },
    {
      label: t("poznajSwiat.formal.labels.phone"),
      value: FOUNDATION_FACTS.phone,
      href: `tel:${FOUNDATION_FACTS.phone.replace(/\s/g, "")}`
    },
    {
      label: t("poznajSwiat.formal.labels.phoneSecondary"),
      value: FOUNDATION_FACTS.phoneSecondary,
      href: `tel:${FOUNDATION_FACTS.phoneSecondary.replace(/\s/g, "")}`
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={5}>
        <Box component="header" sx={{ textAlign: "center" }}>
          <Typography variant="h3" component="h1" gutterBottom color="primary.dark">
            {t("poznajSwiat.hero.title")}
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" sx={{ maxWidth: 640, mx: "auto" }}>
            {t("poznajSwiat.hero.subtitle")}
          </Typography>
        </Box>

        <Box component="section">
          <Typography variant="h5" component="h2" gutterBottom>
            {t("poznajSwiat.mission.title")}
          </Typography>
          <Typography variant="body1" component="div" dangerouslySetInnerHTML={{ __html: missionHtml }} />
        </Box>

        <Box component="section">
          <Typography variant="h5" component="h2" gutterBottom>
            {t("poznajSwiat.activities.title")}
          </Typography>
          <Stack spacing={2}>
            {Array.isArray(activityItems) &&
              activityItems.map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="body1">{item}</Typography>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        </Box>

        <Box component="section">
          <Typography variant="h5" component="h2" gutterBottom>
            {t("poznajSwiat.formal.title")}
          </Typography>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, bgcolor: "background.paper" }}>
            {formalRows.map((row) => (
              <FormalDataRow key={row.label} {...row} />
            ))}
          </Paper>
        </Box>

        <Box component="section">
          <Typography variant="h5" component="h2" gutterBottom>
            {t("poznajSwiat.cooperation.title")}
          </Typography>
          <Typography
            variant="body1"
            component="div"
            paragraph
            dangerouslySetInnerHTML={{ __html: cooperationHtml }}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component="a"
              href={`mailto:${FOUNDATION_FACTS.email}`}
            >
              {t("poznajSwiat.cta.email")}
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to={addLangToPath("/events", i18n.language)}
            >
              {t("poznajSwiat.cta.backToWalacugi")}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
