import React, { useMemo } from "react";
import { Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { sanitizeAboutHtml } from "../utils/sanitizeHtml";

function About() {
  const { t } = useTranslation();
  const sanitized = useMemo(() => sanitizeAboutHtml(t("about_body")), [t]);

  return (
    <Container sx={{ py: 4 }} id="about">
      <Typography variant="h4" gutterBottom align="center">
        {t("about")}
      </Typography>

      <Typography variant="body1" paragraph dangerouslySetInnerHTML={{ __html: sanitized }}>
      </Typography>
    </Container>
  );
}

export default About;
