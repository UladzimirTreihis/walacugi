import React from "react";
import { Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function About({data}) {
  const { t } = useTranslation();

  return (
    <Container sx={{ py: 4 }} id="about">
      <Typography variant="h4" gutterBottom align="center">
        {t("about")}
      </Typography>

      <Typography variant="body1" paragraph dangerouslySetInnerHTML={{__html : t("about_body")}}>
      </Typography>
    </Container>
  );
}

export default About;
