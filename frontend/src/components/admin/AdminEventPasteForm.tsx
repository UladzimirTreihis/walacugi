import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, Link, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useApi from "../../hooks/useApi";
import { type UiFeedback } from "../../utils/feedback";
import { addLangToPath } from "../../utils/langUrl";

const EXAMPLE = `WALACUGI_EVENT_V1
title.be: Паўднёвае ўзбярэжжа Іспаніі і Гібралтар
title.en: Southern coast of Spain and Gibraltar
title.pl: Południowe wybrzeże Hiszpanii i Gibraltar
location.be: Паўднёвая Іспанія / Гібралтар
location.en: Southern Spain / Gibraltar
location.pl: Południowa Hiszpania / Gibraltar
description.be<<
<p>Семь дней вдоль Средиземного моря и Атлантики.</p>
>>
description.en<<
<p>Seven days along the Mediterranean and the Atlantic.</p>
>>
description.pl<<
<p>Siedem dni wzdłuż Morza Śródziemnego i Atlantyku.</p>
>>
approxDate.be:
approxDate.en:
approxDate.pl:
ageRestriction.be: 10+
ageRestriction.en: 10+
ageRestriction.pl: 10+
budget: 490
currency: EUR
startDate: 2027-04-10
endDate: 2027-04-17
datedAt: 2027-04-10
countries: es
chatLink:
difficultyLevel: 3
pinned: false
`;

interface FromPasteResponse {
  created: number;
  ids: string[];
}

export default function AdminEventPasteForm() {
  const { i18n } = useTranslation();
  const { post, loading, error } = useApi();
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  const handleCreate = async () => {
    setFeedback(null);
    setCreatedIds([]);
    if (!text.trim()) {
      setFeedback({ severity: "error", message: "Paste WALACUGI_EVENT_V1 text first." });
      return;
    }

    const result = await post<FromPasteResponse>("/admin/events/from-paste", { text });
    if (!result) {
      return;
    }

    setCreatedIds(result.ids);
    setFeedback({
      severity: "success",
      message: `Created ${result.created} event(s). Add images from the edit page.`
    });
    setText("");
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Import Event
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Paste AI-prepared <code>WALACUGI_EVENT_V1</code> text. All languages and fields must already be filled.
        Images are skipped — add them after create. Format rules live in the repo at{" "}
        <code>content_agent/EVENT_PASTE_FORMAT.md</code> (give that file to AI with your raw text).
      </Typography>

      {loading && <CircularProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}
      {createdIds.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {createdIds.map((id) => (
            <Box key={id} component="div">
              <Link component={RouterLink} to={addLangToPath(`/admin/events/edit/${id}`, i18n.language)}>
                Edit event {id}
              </Link>
            </Box>
          ))}
        </Alert>
      )}

      <TextField
        label="Paste format text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        fullWidth
        multiline
        minRows={18}
        margin="normal"
        placeholder={EXAMPLE}
        inputProps={{ spellCheck: false, style: { fontFamily: "ui-monospace, monospace", fontSize: 13 } }}
      />

      <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={() => void handleCreate()} disabled={loading}>
          Create event(s)
        </Button>
        <Button variant="outlined" onClick={() => setText(EXAMPLE)} disabled={loading}>
          Load example
        </Button>
        <Button variant="text" onClick={() => setText("")} disabled={loading}>
          Clear
        </Button>
      </Box>
    </Box>
  );
}
