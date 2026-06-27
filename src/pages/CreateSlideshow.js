import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import SeoHelmet from "../components/SeoHelmet";
import Loader from "../components/Loader";
import { useAuth } from "../components/AuthContext";
import { baseURL } from "../utils/constants";
import { SnackbarAlert, alphabetize } from "../utils/helperFunctions";
import {
  buildSlideshowPayload,
  buildVerseIndexesFromRange,
  hydrateSlides,
  slideshowLayoutOptions,
} from "../utils/slideshowHelpers";

const panelSx = {
  borderRadius: 4,
  p: { xs: 2, md: 3 },
  boxShadow: "0 18px 50px rgba(30, 40, 60, 0.08)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
};

const layoutLabels = {
  "arab-rom-eng": "Arabic, transliteration, English",
  "arab-eng": "Arabic, English",
  "arab-rom": "Arabic, transliteration",
  arab: "Arabic only",
};

const buildNasheedMap = (nasheeds) =>
  nasheeds.reduce((accumulator, nasheed) => {
    accumulator[nasheed._id] = nasheed;
    return accumulator;
  }, {});

const CreateSlideshow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "error" });
  const [nasheeds, setNasheeds] = useState([]);
  const [slideshowTitle, setSlideshowTitle] = useState("");
  const [selectedNasheedId, setSelectedNasheedId] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("arab-rom-eng");
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(1);
  const [slides, setSlides] = useState([]);

  const nasheedMap = useMemo(() => buildNasheedMap(nasheeds), [nasheeds]);

  const selectedNasheed = useMemo(
    () => nasheeds.find((nasheed) => nasheed._id === selectedNasheedId) || null,
    [nasheeds, selectedNasheedId]
  );

  const totalVerses = selectedNasheed?.eng?.length || 0;
  const verseOptions = Array.from(
    { length: totalVerses },
    (_, index) => index + 1
  );

  useEffect(() => {
    let queryParam = "";
    if (user?.id) {
      queryParam = `?userId=${user.id}`;
    }

    const fetchData = async () => {
      try {
        const requests = [fetch(`${baseURL}/nasheed${queryParam}`)];

        if (isEditMode) {
          requests.push(fetch(`${baseURL}/slideshow/${id}`));
        }

        const responses = await Promise.all(requests);
        const [nasheedResponse, slideshowResponse] = responses;
        const nasheedData = await nasheedResponse.json();

        if (!nasheedResponse.ok) {
          throw new Error(nasheedData.message || "Failed to load nasheeds.");
        }

        const sortedNasheeds = [...nasheedData.nasheeds].sort(alphabetize);
        const nextNasheedMap = buildNasheedMap(sortedNasheeds);

        setNasheeds(sortedNasheeds);

        if (isEditMode && slideshowResponse) {
          const slideshowData = await slideshowResponse.json();

          if (!slideshowResponse.ok) {
            throw new Error(
              slideshowData.message || "Failed to load slideshow details."
            );
          }

          setSlideshowTitle(slideshowData.foundSlideshow.title);
          setSlides(hydrateSlides(slideshowData.foundSlideshow.slides, nextNasheedMap));

          if (slideshowData.foundSlideshow.slides?.length) {
            setSelectedNasheedId(slideshowData.foundSlideshow.slides[0].nasheedId);
          }
        }
      } catch (error) {
        setAlert({
          type: "error",
          message: error.message || "Failed to load slideshow data.",
        });
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, user?.id]);

  useEffect(() => {
    if (!selectedNasheed) {
      setStartVerse(1);
      setEndVerse(1);
      return;
    }

    setStartVerse(1);
    setEndVerse(selectedNasheed.eng.length);
  }, [selectedNasheedId, selectedNasheed]);

  const makeSlideFromNasheed = (nasheed, slideConfig) => {
    const nextStartVerse = slideConfig.startVerse;
    const nextEndVerse = slideConfig.endVerse;
    const nextVerseIndexes = buildVerseIndexesFromRange(
      nextStartVerse,
      nextEndVerse
    );

    return {
      id:
        slideConfig.id ||
        `${nasheed._id}-${nextStartVerse}-${nextEndVerse}-${Date.now()}`,
      nasheedId: nasheed._id,
      engTitle: nasheed.engTitle,
      arabTitle: nasheed.arabTitle,
      startVerse: nextStartVerse,
      endVerse: nextEndVerse,
      layout: slideConfig.layout || "arab-rom-eng",
      verseIndexes: nextVerseIndexes,
      verses: nextVerseIndexes.map((verseIndex) => ({
        verseNumber: verseIndex + 1,
        arab: nasheed.arab[verseIndex],
        rom: nasheed.rom[verseIndex],
        eng: nasheed.eng[verseIndex],
      })),
    };
  };

  const handleAddSlide = () => {
    if (!selectedNasheed) {
      setAlert({ type: "error", message: "Choose a nasheed first." });
      setShowAlert(true);
      return;
    }

    if (startVerse > endVerse) {
      setAlert({
        type: "error",
        message: "The ending verse must be after the starting verse.",
      });
      setShowAlert(true);
      return;
    }

    setSlides((prev) => [
      ...prev,
      makeSlideFromNasheed(selectedNasheed, {
        startVerse,
        endVerse,
        layout: selectedLayout,
      }),
    ]);
  };

  const handleRemoveSlide = (slideId) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
  };

  const handleUpdateSlide = (slideId, changes) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id !== slideId) {
          return slide;
        }

        const nextSlide = { ...slide, ...changes };
        const slideNasheed = nasheedMap[nextSlide.nasheedId];

        if (!slideNasheed) {
          return slide;
        }

        if (nextSlide.endVerse < nextSlide.startVerse) {
          nextSlide.endVerse = nextSlide.startVerse;
        }

        return makeSlideFromNasheed(slideNasheed, nextSlide);
      })
    );
  };

  const draftPayload = {
    title: slideshowTitle,
    slides: slides.map((slide, index) => ({
      order: index + 1,
      nasheedId: slide.nasheedId,
      engTitle: slide.engTitle,
      startVerse: slide.startVerse,
      endVerse: slide.endVerse,
      layout: slide.layout,
    })),
  };

  const handleSaveSlideshow = async () => {
    if (!token || !user?.id) {
      setAlert({
        type: "error",
        message: "You must be logged in to save a slideshow.",
      });
      setShowAlert(true);
      return;
    }

    if (!slideshowTitle.trim()) {
      setAlert({
        type: "error",
        message: "Add a slideshow title before saving.",
      });
      setShowAlert(true);
      return;
    }

    if (slides.length === 0) {
      setAlert({
        type: "error",
        message: "Add at least one nasheed selection to your slideshow.",
      });
      setShowAlert(true);
      return;
    }

    setSaving(true);

    try {
      const payload = buildSlideshowPayload({
        title: slideshowTitle,
        slides,
        creatorId: user.id,
      });

      const response = await fetch(
        isEditMode ? `${baseURL}/slideshow/${id}` : `${baseURL}/slideshow/create`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save slideshow.");
      }

      setAlert({
        type: "success",
        message: isEditMode
          ? "Slideshow updated successfully."
          : "Slideshow created successfully.",
      });
      setShowAlert(true);
      setTimeout(() => navigate("/"), 700);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to save slideshow.",
      });
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlideshow = async () => {
    if (!token || !isEditMode) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${baseURL}/slideshow/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete slideshow.");
      }

      setAlert({
        type: "success",
        message: result.message || "Slideshow deleted successfully.",
      });
      setShowAlert(true);
      setShowDeleteDialog(false);
      setTimeout(() => navigate("/"), 700);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to delete slideshow.",
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <SeoHelmet
        title={
          isEditMode
            ? `Edit slideshow ${slideshowTitle || ""}`.trim()
            : "Build a slideshow from your nasheeds"
        }
        description={
          "Pick nasheeds and specific verse ranges to create or edit a slideshow."
        }
        url={`https://dhikrpedia.com/create/slideshow${id ? `/${id}` : ""}`}
        type="website"
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />

        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
        >
          <DialogTitle>
            Are you sure you want to delete this slideshow?
          </DialogTitle>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowDeleteDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSlideshow}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ textAlign: "left", mb: 1 }}>
              {isEditMode ? "Edit slideshow" : "New slideshow"}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: "left",
                fontSize: "1.1rem",
                color: "text.secondary",
              }}
            >
              Choose a nasheed, set the verse range you want, and build the
              slideshow in order.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Each slideshow item stores the nasheed, the included verse indexes,
            and the layout choice used during playback.
          </Alert>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1.1fr) minmax(360px, 0.9fr)",
              },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Paper sx={panelSx}>
              <Stack spacing={3}>
                <TextField
                  label="Slideshow title"
                  value={slideshowTitle}
                  onChange={(event) => setSlideshowTitle(event.target.value)}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="nasheed-select-label">Nasheed</InputLabel>
                  <Select
                    labelId="nasheed-select-label"
                    label="Nasheed"
                    value={selectedNasheedId}
                    onChange={(event) => setSelectedNasheedId(event.target.value)}
                  >
                    {nasheeds.map((nasheed) => (
                      <MenuItem key={nasheed._id} value={nasheed._id}>
                        {nasheed.engTitle}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <FormControl fullWidth disabled={!selectedNasheed}>
                    <InputLabel id="start-verse-label">From verse</InputLabel>
                    <Select
                      labelId="start-verse-label"
                      label="From verse"
                      value={startVerse}
                      onChange={(event) => {
                        const nextStart = Number(event.target.value);
                        setStartVerse(nextStart);
                        if (endVerse < nextStart) {
                          setEndVerse(nextStart);
                        }
                      }}
                    >
                      {verseOptions.map((verseNumber) => (
                        <MenuItem key={`start-${verseNumber}`} value={verseNumber}>
                          Verse {verseNumber}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth disabled={!selectedNasheed}>
                    <InputLabel id="end-verse-label">To verse</InputLabel>
                    <Select
                      labelId="end-verse-label"
                      label="To verse"
                      value={endVerse}
                      onChange={(event) => setEndVerse(Number(event.target.value))}
                    >
                      {verseOptions
                        .filter((verseNumber) => verseNumber >= startVerse)
                        .map((verseNumber) => (
                          <MenuItem key={`end-${verseNumber}`} value={verseNumber}>
                            Verse {verseNumber}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id="layout-select-label">Layout</InputLabel>
                    <Select
                      labelId="layout-select-label"
                      label="Layout"
                      value={selectedLayout}
                      onChange={(event) => setSelectedLayout(event.target.value)}
                    >
                      {slideshowLayoutOptions.map((layout) => (
                        <MenuItem key={layout} value={layout}>
                          {layoutLabels[layout]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {selectedNasheed && (
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 3, backgroundColor: "#faf8f2" }}
                  >
                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="h6">{selectedNasheed.engTitle}</Typography>
                        <Chip
                          label={`${totalVerses} total verses`}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Typography sx={{ color: "text.secondary" }}>
                        {selectedNasheed.arabTitle}
                      </Typography>
                      <Divider />
                      <Typography variant="subtitle2">
                        Selected verse preview
                      </Typography>
                      <Stack spacing={1.5}>
                        {selectedNasheed.eng
                          .slice(startVerse - 1, endVerse)
                          .map((verse, index) => (
                            <Box
                              key={`${selectedNasheed._id}-${startVerse + index}`}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: "rgba(255,255,255,0.9)",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700 }}
                              >
                                Verse {startVerse + index}
                              </Typography>
                              <Typography sx={{ mt: 0.5 }}>
                                {selectedNasheed.arab[startVerse + index - 1]}
                              </Typography>
                              <Typography
                                sx={{
                                  mt: 0.5,
                                  color: "text.secondary",
                                  fontStyle: "italic",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: selectedNasheed.rom[startVerse + index - 1],
                                }}
                              />
                              <Typography sx={{ mt: 0.5 }}>{verse}</Typography>
                            </Box>
                          ))}
                      </Stack>
                    </Stack>
                  </Paper>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                  <Button variant="contained" onClick={handleAddSlide}>
                    Add to slideshow
                  </Button>
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={3}>
              <Paper sx={panelSx}>
                <Typography variant="h6" sx={{ textAlign: "left", mb: 2 }}>
                  Slideshow items
                </Typography>
                {slides.length === 0 ? (
                  <Typography sx={{ color: "text.secondary", textAlign: "left" }}>
                    No items yet. Add a nasheed selection to start building this
                    slideshow.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {slides.map((slide, index) => {
                      const slideNasheed = nasheedMap[slide.nasheedId];
                      const slideVerseOptions = Array.from(
                        { length: slideNasheed?.eng?.length || 0 },
                        (_, optionIndex) => optionIndex + 1
                      );

                      return (
                        <Card
                          key={slide.id}
                          variant="outlined"
                          sx={{ borderRadius: 3, textAlign: "left" }}
                        >
                          <CardContent>
                            <Stack spacing={2}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 2,
                                  alignItems: "flex-start",
                                }}
                              >
                                <Box>
                                  <Typography variant="overline">
                                    Item {index + 1}
                                  </Typography>
                                  <Typography variant="h6">
                                    {slide.engTitle}
                                  </Typography>
                                  <Typography color="text.secondary">
                                    Verses {slide.startVerse}-{slide.endVerse}
                                  </Typography>
                                </Box>
                                <Button
                                  color="error"
                                  onClick={() => handleRemoveSlide(slide.id)}
                                >
                                  Remove
                                </Button>
                              </Box>
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "1fr 1fr 1fr",
                                  },
                                  gap: 2,
                                }}
                              >
                                <FormControl fullWidth>
                                  <InputLabel>From verse</InputLabel>
                                  <Select
                                    label="From verse"
                                    value={slide.startVerse}
                                    onChange={(event) =>
                                      handleUpdateSlide(slide.id, {
                                        startVerse: Number(event.target.value),
                                      })
                                    }
                                  >
                                    {slideVerseOptions.map((verseNumber) => (
                                      <MenuItem
                                        key={`${slide.id}-start-${verseNumber}`}
                                        value={verseNumber}
                                      >
                                        Verse {verseNumber}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                  <InputLabel>To verse</InputLabel>
                                  <Select
                                    label="To verse"
                                    value={slide.endVerse}
                                    onChange={(event) =>
                                      handleUpdateSlide(slide.id, {
                                        endVerse: Number(event.target.value),
                                      })
                                    }
                                  >
                                    {slideVerseOptions
                                      .filter(
                                        (verseNumber) =>
                                          verseNumber >= slide.startVerse
                                      )
                                      .map((verseNumber) => (
                                        <MenuItem
                                          key={`${slide.id}-end-${verseNumber}`}
                                          value={verseNumber}
                                        >
                                          Verse {verseNumber}
                                        </MenuItem>
                                      ))}
                                  </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                  <InputLabel>Layout</InputLabel>
                                  <Select
                                    label="Layout"
                                    value={slide.layout}
                                    onChange={(event) =>
                                      handleUpdateSlide(slide.id, {
                                        layout: event.target.value,
                                      })
                                    }
                                  >
                                    {slideshowLayoutOptions.map((layout) => (
                                      <MenuItem key={layout} value={layout}>
                                        {layoutLabels[layout]}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                              <Divider />
                              {slide.verses.map((verse) => (
                                <Box key={`${slide.id}-${verse.verseNumber}`}>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    Verse {verse.verseNumber}
                                  </Typography>
                                  <Typography sx={{ mt: 0.5 }}>
                                    {verse.arab}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      mt: 0.5,
                                      color: "text.secondary",
                                      fontStyle: "italic",
                                    }}
                                    dangerouslySetInnerHTML={{ __html: verse.rom }}
                                  />
                                  <Typography sx={{ mt: 0.5 }}>{verse.eng}</Typography>
                                </Box>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Paper>

              <Paper sx={panelSx}>
                <Typography variant="h6" sx={{ textAlign: "left", mb: 2 }}>
                  Actions
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSaveSlideshow}
                    disabled={saving}
                  >
                    {isEditMode ? "Update slideshow" : "Save slideshow"}
                  </Button>
                  {isEditMode && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete slideshow
                    </Button>
                  )}
                </Stack>
              </Paper>

              <Paper sx={panelSx}>
                <Typography variant="h6" sx={{ textAlign: "left", mb: 2 }}>
                  Draft structure
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    overflowX: "auto",
                    textAlign: "left",
                    backgroundColor: "#0f172a",
                    color: "#e2e8f0",
                    borderRadius: 3,
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(draftPayload, null, 2)}
                </Box>
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </>
  );
};

export default CreateSlideshow;
