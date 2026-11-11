import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  ChevronLeft,
  ChevronRight,
  Close,
  ContentCopy,
  DeleteOutline,
  DragIndicator,
  ExpandLess,
  ExpandMore,
  Save,
  Search,
  NoteAddOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import SeoHelmet from "../components/SeoHelmet";
import Loader from "../components/Loader";
import { useAuth } from "../components/AuthContext";
import { baseURL } from "../utils/constants";
import { SnackbarAlert, alphabetize } from "../utils/helperFunctions";
import {
  buildBlocksFromNasheedV2,
  buildSlideshowPayload,
  hydrateSlides,
  resolveSlideshowBlock,
  resolveSlideshowBlocks,
  slideshowLayoutOptions,
} from "../utils/slideshowHelpers";

const idOf = (value) => String(value ?? "");
const makeId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
const layoutLabels = {
  "arab-rom-eng": "Arabic, transliteration, English",
  "arab-eng": "Arabic, English",
  "arab-rom": "Arabic, transliteration",
  arab: "Arabic only",
};
const panelSx = {
  borderRadius: 3,
  p: { xs: 2.5, md: 3.5 },
  border: "1px solid rgba(15,23,42,.1)",
};
const move = (items, from, to) => {
  if (to < 0 || to >= items.length || from === to) return items;
  const result = [...items];
  result.splice(to, 0, result.splice(from, 1)[0]);
  return result;
};

// Render plain text instead of injecting HTML from lyric fields.
const LyricLine = ({ line, layout, compact = false }) => (
  <Stack
    spacing={0.8}
    sx={{
      minWidth: 0,
      textAlign: "center",
      "& .MuiTypography-root": { lineHeight: 1.65 },
    }}
  >
    <Typography
      dir="rtl"
      sx={{
        fontSize: compact ? "2rem" : "2.2rem",
        overflowWrap: "anywhere",
      }}
    >
      {line.arab}
    </Typography>
    {(layout === "arab-rom-eng" || layout === "arab-rom") && (
      <Typography
        color="text.secondary"
        sx={{
          fontSize: "1.25rem",
          fontStyle: "italic",
          overflowWrap: "anywhere",
        }}
      >
        {line.rom}
      </Typography>
    )}
    {(layout === "arab-rom-eng" || layout === "arab-eng") && (
      <Typography sx={{ fontSize: "1.25rem", overflowWrap: "anywhere" }}>
        {line.eng}
      </Typography>
    )}
  </Stack>
);

const CreateSlideshow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    type: "error",
    message: "",
  });
  const [nasheeds, setNasheeds] = useState([]);
  const [title, setTitle] = useState("");
  const [slides, setSlides] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [customDrag, setCustomDrag] = useState(null);
  const [customDrop, setCustomDrop] = useState(null);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const carouselRef = useRef(null);
  const pendingNavigation = useRef(null);
  const programmaticScrollRef = useRef(false);

  const notify = (message, type = "error") =>
    setAlert({ open: true, message, type });
  const nasheedMap = useMemo(
    () => Object.fromEntries(nasheeds.map((n) => [idOf(n._id), n])),
    [nasheeds],
  );
  // Count lines once per slide change rather than on every UI interaction.
  const slideLineCounts = useMemo(
    () =>
      slides.map((slide) => {
        if (slide.type === "custom") return (slide.lines || []).length;
        const nasheed = nasheedMap[slide.nasheedId];
        return nasheed
          ? resolveSlideshowBlocks(slide.blocks || [], nasheed).length
          : 0;
      }),
    [slides, nasheedMap],
  );

  const filteredNasheeds = useMemo(
    () =>
      nasheeds.filter((n) =>
        `${n.engTitle || ""} ${n.arabTitle || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [nasheeds, search],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
        const responses = await Promise.all([
          fetch(`${baseURL}/nasheedV2${query}`),
          ...(isEditMode ? [fetch(`${baseURL}/slideshow/${id}`)] : []),
        ]);
        const data = await Promise.all(responses.map((r) => r.json()));
        responses.forEach((r, i) => {
          if (!r.ok)
            throw new Error(
              data[i]?.message || "Failed to load slideshow data",
            );
        });
        const list = Array.isArray(data[0])
          ? data[0]
          : data[0].nasheeds ||
            data[0].nasheedsV2 ||
            data[0].foundNasheeds ||
            [];
        if (!Array.isArray(list))
          throw new Error("Unexpected V2 nasheed response");
        const sorted = [...list].sort(alphabetize);
        if (cancelled) return;
        setNasheeds(sorted);
        if (isEditMode) {
          const found = data[1]?.foundSlideshow || data[1];
          if (!found) throw new Error("Slideshow not found");
          console.log("here is found", found);
          setTitle(found.title || "");
          setSlides(
            hydrateSlides(
              found.slides || [],
              Object.fromEntries(sorted.map((n) => [idOf(n._id), n])),
            ),
          );
        }
      } catch (error) {
        if (!cancelled) notify(error.message || "Unable to load slideshow");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, user?.id]);

  const navigateTo = (index, behavior = "smooth") => {
    const next = Math.max(0, Math.min(index, slides.length - 1));
    const viewport = carouselRef.current;

    programmaticScrollRef.current = true;
    setActiveIndex(next);

    if (viewport) {
      viewport.scrollTo({
        left: viewport.clientWidth * next,
        behavior,
      });
    } else {
      programmaticScrollRef.current = false;
    }
  };

  useEffect(() => {
    if (pendingNavigation.current !== null) {
      const next = pendingNavigation.current;
      pendingNavigation.current = null;
      navigateTo(next);
    } else if (activeIndex >= slides.length && slides.length) {
      navigateTo(slides.length - 1);
    } else if (!slides.length && activeIndex !== 0) {
      setActiveIndex(0);
    }
  }, [slides.length]);

  const updateSlide = (slideId, updater) =>
    setSlides((prev) =>
      prev.map((slide) => (slide.id === slideId ? updater(slide) : slide)),
    );
  const updateBlocks = (slideId, updater) =>
    updateSlide(slideId, (slide) => ({
      ...slide,
      blocks: updater(slide.blocks),
    }));
  const updateBlock = (slideId, blockId, updater) =>
    updateBlocks(slideId, (blocks) =>
      blocks.map((block) => (block.id === blockId ? updater(block) : block)),
    );

  const addSelected = () => {
    const additions = selectedIds.flatMap((nasheedId) => {
      const nasheed = nasheedMap[nasheedId];
      if (!nasheed) return [];
      const blocks = buildBlocksFromNasheedV2(nasheed);
      if (!blocks.length) return [];
      return [
        {
          id: makeId(),
          type: "nasheed",
          nasheedId,
          engTitle: nasheed.engTitle,
          arabTitle: nasheed.arabTitle,
          layout: "arab-rom-eng",
          showTitleIntro: false,
          blocks,
        },
      ];
    });
    if (!additions.length)
      return notify(
        "Choose nasheeds with at least one playable stanza or refrain.",
      );
    pendingNavigation.current = slides.length;
    setSlides((prev) => [...prev, ...additions]);
    setSelectedIds([]);
  };

  const addCustomSlide = () => {
    const nextIndex = slides.length;
    const slide = {
      id: makeId(),
      type: "custom",
      title: "Untitled custom slide",
      lines: [{ id: makeId(), arab: "", rom: "", eng: "" }],
    };
    pendingNavigation.current = nextIndex;
    setSlides((prev) => [...prev, slide]);
  };
  const updateCustomLine = (slideId, lineId, field, value) =>
    updateSlide(slideId, (slide) => ({
      ...slide,
      lines: slide.lines.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line,
      ),
    }));
  const updateCustomLines = (slideId, updater) =>
    updateSlide(slideId, (slide) => ({
      ...slide,
      lines: updater(slide.lines),
    }));
  const onCustomDragOver = (event, slideId, index) => {
    if (!customDrag || customDrag.slideId !== slideId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setCustomDrop((previous) =>
      previous?.slideId === slideId &&
      previous.index === index &&
      previous.position === position
        ? previous
        : { slideId, index, position },
    );
  };
  const onCustomDrop = (event, slideId, index) => {
    event.preventDefault();
    event.stopPropagation();
    if (!customDrag || customDrag.slideId !== slideId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const after =
      customDrop?.slideId === slideId && customDrop?.index === index
        ? customDrop.position === "after"
        : event.clientY >= rect.top + rect.height / 2;
    const insertion = index + (after ? 1 : 0);
    const destination =
      insertion > customDrag.index ? insertion - 1 : insertion;
    updateCustomLines(slideId, (lines) =>
      move(lines, customDrag.index, destination),
    );
    setCustomDrag(null);
    setCustomDrop(null);
  };

  const removeSlide = (index) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
    pendingNavigation.current = Math.max(0, Math.min(index, slides.length - 2));
  };
  const reorderSlides = (from, to) => {
    setSlides((prev) => move(prev, from, to));
    pendingNavigation.current = to;
  };
  const duplicateBlock = (slideId, index) =>
    updateBlocks(slideId, (blocks) => {
      const next = [...blocks];
      next.splice(index + 1, 0, {
        ...blocks[index],
        id: makeId(),
        lineIds: [...blocks[index].lineIds],
      });
      return next;
    });

  // Native drag-and-drop with a before/after insertion indicator.
  const clearDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };
  const onDragStart = (event, payload) => {
    setDragging(payload);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  };
  const onDragOverItem = (event, target) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      !dragging ||
      dragging.kind !== target.kind ||
      dragging.slideId !== target.slideId
    )
      return;
    if (dragging.kind === "line" && dragging.blockId !== target.blockId) return;
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDropTarget((previous) =>
      previous &&
      previous.kind === target.kind &&
      previous.slideId === target.slideId &&
      previous.blockId === target.blockId &&
      previous.index === target.index &&
      previous.position === position
        ? previous
        : { ...target, position },
    );
  };
  const onDrop = (event, target) => {
    event.preventDefault();
    event.stopPropagation();
    const source = dragging;
    const position =
      dropTarget?.kind === target.kind &&
      dropTarget?.slideId === target.slideId &&
      dropTarget?.blockId === target.blockId &&
      dropTarget?.index === target.index
        ? dropTarget.position
        : event.clientY <
            event.currentTarget.getBoundingClientRect().top +
              event.currentTarget.getBoundingClientRect().height / 2
          ? "before"
          : "after";
    clearDrag();
    if (
      !source ||
      source.kind !== target.kind ||
      source.slideId !== target.slideId
    )
      return;
    // Convert the visible insertion boundary into an index after removing the source.
    const insertionIndex = target.index + (position === "after" ? 1 : 0);
    const destination =
      insertionIndex > source.index ? insertionIndex - 1 : insertionIndex;
    if (source.kind === "block") {
      updateBlocks(target.slideId, (blocks) =>
        move(blocks, source.index, destination),
      );
    } else if (source.kind === "line" && source.blockId === target.blockId) {
      updateBlock(target.slideId, target.blockId, (block) => ({
        ...block,
        lineIds: move(block.lineIds, source.index, destination),
      }));
    }
  };
  const indicatorSx = (target) => {
    const active =
      dropTarget &&
      dragging &&
      dropTarget.kind === target.kind &&
      dropTarget.slideId === target.slideId &&
      dropTarget.blockId === target.blockId &&
      dropTarget.index === target.index;
    if (!active) return {};
    const edge = dropTarget.position === "before" ? "top" : "bottom";
    return {
      position: "relative",
      zIndex: 1,
      [`&::${edge === "top" ? "before" : "after"}`]: {
        content: '""',
        position: "absolute",
        left: 4,
        right: 4,
        [edge]: -7,
        height: 3,
        backgroundColor: "#2563eb",
        borderRadius: 4,
        boxShadow: "0 0 0 2px rgba(37,99,235,.12)",
        pointerEvents: "none",
        zIndex: 10,
      },
    };
  };

  const validateBeforeSave = () => {
    if (!title.trim()) return "Enter a slideshow title.";
    if (!slides.length) return "Add at least one nasheed.";
    for (const slide of slides) {
      if (slide.type === "custom") {
        if (!slide.title?.trim()) return "Give every custom slide a title.";
        if (!slide.lines?.length)
          return `Custom slide ${slide.title} needs at least one line.`;
        if (
          slide.lines.some(
            (line) => ![line.arab, line.rom, line.eng].some((v) => v?.trim()),
          )
        )
          return `Each line in ${slide.title} needs at least one populated field.`;
        continue;
      }
      const nasheed = nasheedMap[slide.nasheedId];
      if (!nasheed)
        return `Source nasheed for ${slide.engTitle} is unavailable.`;
      if (!slide.blocks.length)
        return `${slide.engTitle} has no blocks. Remove the item or restore a block.`;
      for (const block of slide.blocks) {
        if (!block.lineIds.length)
          return "A block has no lines. Remove that block instead.";
        if (
          resolveSlideshowBlock(block, nasheed).length !== block.lineIds.length
        ) {
          return `Some source lines in ${slide.engTitle} are missing or no longer belong to the original refrain.`;
        }
      }
    }
    return null;
  };

  const save = async () => {
    if (!token || !user?.id)
      return notify("You must be logged in to save a slideshow.");
    const problem = validateBeforeSave();
    if (problem) return notify(problem);
    setSaving(true);
    try {
      const response = await fetch(
        isEditMode
          ? `${baseURL}/slideshow/${id}`
          : `${baseURL}/slideshow/create`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            buildSlideshowPayload({ title, slides, creatorId: user.id }),
          ),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to save slideshow");
      notify(
        isEditMode ? "Slideshow updated." : "Slideshow created.",
        "success",
      );
      setTimeout(() => navigate("/"), 700);
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  };

  const destroy = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`${baseURL}/slideshow/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to delete slideshow");
      setDeleteDialog(false);
      notify("Slideshow deleted.", "success");
      setTimeout(() => navigate("/"), 700);
    } catch (error) {
      notify(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <SeoHelmet
        title={isEditMode ? `Edit slideshow ${title}` : "Create slideshow"}
        description="Build a custom slideshow from V2 nasheed stanzas and refrains."
        url={`https://dhikrpedia.com/create/slideshow${id ? `/${id}` : ""}`}
        type="website"
      />
      <Container
        maxWidth={false}
        sx={{
          py: 4,
          px: { xs: 2, md: 5, xl: 8 },
          maxWidth: "1700px",
          "& .MuiTypography-h4": { fontSize: "2rem", fontWeight: 700 },
          "& .MuiTypography-h5": { fontSize: "1.65rem" },
          "& .MuiTypography-h6": { fontSize: "1.4rem", fontWeight: 650 },
          "& .MuiTypography-subtitle1": { fontSize: "1.2rem" },
          "& .MuiTypography-subtitle2": {
            fontSize: "1.125rem",
            fontWeight: 600,
          },
          "& .MuiTypography-body2": { fontSize: "1.05rem" },
          "& .MuiTypography-caption": { fontSize: "0.95rem" },
          "& .MuiTypography-overline": {
            fontSize: "0.95rem",
            letterSpacing: "0.06em",
          },
          "& .MuiButton-root": {
            fontSize: "1.05rem",
            minHeight: 44,
            textTransform: "none",
          },
          "& .MuiChip-label": { fontSize: "0.95rem" },
          "& .MuiInputBase-input": { fontSize: "1.1rem" },
          "& .MuiInputLabel-root": { fontSize: "1.05rem" },
          "& .MuiSelect-select": { fontSize: "1.1rem" },
          "& .MuiMenuItem-root": { fontSize: "1.05rem" },
          "& .MuiIconButton-root": { padding: "10px" },
          "& .MuiSvgIcon-root": { fontSize: "1.4rem" },
        }}
      >
        <SnackbarAlert
          open={alert.open}
          onClose={() => setAlert((a) => ({ ...a, open: false }))}
          message={alert.message}
          type={alert.type}
        />
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete this slideshow permanently?</DialogTitle>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={deleting}
              onClick={destroy}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" textAlign="left">
                {isEditMode ? "Edit slideshow" : "Create slideshow"}
              </Typography>
              <Typography
                color="text.secondary"
                textAlign="left"
                variant="body2"
              >
                Select nasheeds, then arrange the blocks and lines to customize
                playback.
              </Typography>
            </Box>
            <TextField
              label="Slideshow title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="small"
              sx={{ minWidth: { md: 280 } }}
            />
            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Save />
                )
              }
              onClick={save}
              disabled={saving}
            >
              {isEditMode ? "Update" : "Save"} slideshow
            </Button>
            {isEditMode && (
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutline />}
                onClick={() => setDeleteDialog(true)}
              >
                Delete
              </Button>
            )}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1fr) minmax(0, 1fr)",
              },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            <Paper sx={panelSx}>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">Nasheed library</Typography>
                  <Chip size="small" label={`${selectedIds.length} selected`} />
                </Stack>
                <TextField
                  size="small"
                  placeholder="Search nasheeds"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
                <Box
                  sx={{
                    maxHeight: { xs: 350, md: 450 },
                    overflowY: "auto",
                    pr: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(1, minmax(0, 1fr))",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                    }}
                  >
                    {filteredNasheeds.map((n) => {
                      const key = idOf(n._id);
                      const selected = selectedIds.includes(key);

                      return (
                        <Card
                          key={key}
                          variant="outlined"
                          onClick={() =>
                            setSelectedIds((prev) =>
                              selected
                                ? prev.filter((x) => x !== key)
                                : [...prev, key],
                            )
                          }
                          sx={{
                            cursor: "pointer",
                            position: "relative",
                            borderRadius: 2,
                            borderWidth: selected ? 2 : 1,
                            borderColor: selected ? "primary.main" : "divider",
                            bgcolor: selected
                              ? "action.selected"
                              : "background.paper",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: 3,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent
                            sx={{
                              p: 2,
                              minHeight: 125,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              textAlign: "center",
                              "&:last-child": { pb: 2 },
                            }}
                          >
                            <Checkbox
                              checked={selected}
                              size="small"
                              tabIndex={-1}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                pointerEvents: "none",
                              }}
                            />

                            <Typography
                              fontWeight={selected ? 700 : 600}
                              sx={{
                                fontSize: "1.1rem",
                                lineHeight: 1.4,
                                mb: 0.75,
                                px: 2,
                              }}
                            >
                              {n.engTitle}
                            </Typography>

                            <Typography
                              dir="rtl"
                              color="text.secondary"
                              sx={{
                                fontSize: "1.3rem",
                                lineHeight: 1.7,
                              }}
                            >
                              {n.arabTitle}
                            </Typography>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>

                  {!filteredNasheeds.length && (
                    <Typography
                      color="text.secondary"
                      textAlign="center"
                      sx={{ py: 4 }}
                    >
                      No matching nasheeds.
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!selectedIds.length}
                  onClick={addSelected}
                  fullWidth
                >
                  Add {selectedIds.length || "selected"}{" "}
                  {selectedIds.length === 1 ? "nasheed" : "nasheeds"} to
                  slideshow
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NoteAddOutlined />}
                  fullWidth
                  onClick={addCustomSlide}
                  sx={{ fontSize: "1rem", py: 1.25 }}
                >
                  Add custom slide
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ ...panelSx, minWidth: 0 }}>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="h6">Draft structure</Typography>
                  <Chip label={`${slides.length} items`} />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={
                      !slides.some(
                        (slide) =>
                          slide.type !== "custom" && !slide.showTitleIntro,
                      )
                    }
                    onClick={() =>
                      setSlides((previous) =>
                        previous.map((slide) =>
                          slide.type === "custom"
                            ? slide
                            : { ...slide, showTitleIntro: true },
                        ),
                      )
                    }
                  >
                    Enable all title intros
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={
                      !slides.some(
                        (slide) =>
                          slide.type !== "custom" && slide.showTitleIntro,
                      )
                    }
                    onClick={() =>
                      setSlides((previous) =>
                        previous.map((slide) =>
                          slide.type === "custom"
                            ? slide
                            : { ...slide, showTitleIntro: false },
                        ),
                      )
                    }
                  >
                    Remove all title intros
                  </Button>
                </Stack>
                <Typography color="text.secondary" sx={{ fontSize: "1.05rem" }}>
                  Your slideshow's running order. Select an item to edit it
                  below, or use the arrows to reorder it.
                </Typography>
                <Box
                  sx={{
                    maxHeight: { xs: 320, md: 390 },
                    minHeight: 130,
                    overflowY: "auto",
                    pr: 0.5,
                  }}
                >
                  <Stack spacing={1}>
                    {slides.map((slide, index) => {
                      const isCustom = slide.type === "custom";
                      const count = slideLineCounts[index];
                      return (
                        <Paper
                          key={slide.id}
                          variant="outlined"
                          onClick={() => navigateTo(index)}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            cursor: "pointer",
                            borderColor:
                              index === activeIndex
                                ? "primary.main"
                                : "divider",
                            bgcolor:
                              index === activeIndex
                                ? "action.selected"
                                : "background.paper",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography
                              color="primary"
                              fontWeight={700}
                              sx={{ minWidth: 32, fontSize: "1.2rem" }}
                            >
                              {index + 1}.
                            </Typography>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                fontWeight={600}
                                sx={{ fontSize: "1.15rem" }}
                              >
                                {isCustom ? slide.title : slide.engTitle}
                              </Typography>
                              <Typography
                                color="text.secondary"
                                sx={{ fontSize: "1rem" }}
                              >
                                {isCustom
                                  ? `Custom slide · ${count} lines`
                                  : `${slide.blocks.length} blocks · ${count} lines · ${layoutLabels[slide.layout]}`}
                              </Typography>
                              {!isCustom && (
                                <FormControlLabel
                                  onClick={(event) => event.stopPropagation()}
                                  sx={{ mt: 0.75, ml: 0, mr: 0 }}
                                  control={
                                    <Switch
                                      size="small"
                                      checked={Boolean(slide.showTitleIntro)}
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      onChange={(event) => {
                                        event.stopPropagation();
                                        updateSlide(slide.id, (current) => ({
                                          ...current,
                                          showTitleIntro: event.target.checked,
                                        }));
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography sx={{ fontSize: "0.95rem" }}>
                                      Show title before this nasheed
                                    </Typography>
                                  }
                                />
                              )}
                            </Box>
                            <Tooltip title="Move earlier">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={index === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderSlides(index, index - 1);
                                  }}
                                >
                                  <ArrowUpward />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move later">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={index === slides.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderSlides(index, index + 1);
                                  }}
                                >
                                  <ArrowDownward />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Remove from draft">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSlide(index);
                                }}
                              >
                                <DeleteOutline />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Paper>
                      );
                    })}
                    {!slides.length && (
                      <Alert severity="info">
                        Select nasheeds from the library to build your draft.
                      </Alert>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Paper sx={{ ...panelSx, minWidth: 0 }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h5" fontWeight={700}>
                  Slides · full-width editor
                </Typography>
                <Chip size="small" label={`${slides.length} items`} />
              </Stack>
              {!slides.length ? (
                <Alert severity="info">
                  Select one or more nasheeds on the left, then click Add to
                  slideshow.
                </Alert>
              ) : (
                <>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Button
                      size="small"
                      startIcon={<ChevronLeft />}
                      disabled={activeIndex === 0}
                      onClick={() => navigateTo(activeIndex - 1)}
                    >
                      Previous
                    </Button>
                    <Typography variant="body2" fontWeight={600}>
                      {activeIndex + 1} of {slides.length}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ChevronRight />}
                      disabled={activeIndex === slides.length - 1}
                      onClick={() => navigateTo(activeIndex + 1)}
                    >
                      Next
                    </Button>
                  </Stack>
                  <Box
                    ref={carouselRef}
                    onScroll={(e) => {
                      if (programmaticScrollRef.current) return;

                      const viewport = e.currentTarget;
                      const width = viewport.clientWidth;

                      if (!width) return;

                      const index = Math.min(
                        slides.length - 1,
                        Math.max(0, Math.round(viewport.scrollLeft / width)),
                      );

                      setActiveIndex((previous) =>
                        previous === index ? previous : index,
                      );
                    }}
                    onScrollEnd={(e) => {
                      programmaticScrollRef.current = false;

                      const viewport = e.currentTarget;
                      const width = viewport.clientWidth;

                      if (!width) return;

                      const index = Math.min(
                        slides.length - 1,
                        Math.max(0, Math.round(viewport.scrollLeft / width)),
                      );

                      setActiveIndex(index);
                    }}
                    sx={{
                      display: "flex",
                      overflowX: "auto",
                      scrollSnapType: "x mandatory",
                      scrollBehavior: "smooth",
                      scrollbarWidth: "none",
                      "&::-webkit-scrollbar": { display: "none" },
                    }}
                  >
                    {slides.map((slide, slideIndex) => {
                      const nasheed = nasheedMap[slide.nasheedId];
                      const isCustom = slide.type === "custom";
                      const verseCount = slideLineCounts[slideIndex];
                      return (
                        <Box
                          key={slide.id}
                          sx={{
                            flex: "0 0 100%",
                            minWidth: 0,
                            scrollSnapAlign: "start",
                            px: 0.5,
                          }}
                        >
                          {Math.abs(slideIndex - activeIndex) <= 1 && (
                            <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                              <CardContent>
                                <Stack spacing={2}>
                                  <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    justifyContent="space-between"
                                    spacing={1}
                                  >
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography
                                        variant="overline"
                                        color="text.secondary"
                                      >
                                        Item {slideIndex + 1}
                                      </Typography>
                                      <Typography variant="h6">
                                        {isCustom
                                          ? slide.title
                                          : slide.engTitle}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {isCustom
                                          ? "Custom slide"
                                          : `${slide.blocks.length} blocks`}{" "}
                                        · {verseCount} lines
                                      </Typography>
                                    </Box>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={0.25}
                                    >
                                      <Tooltip title="Move item earlier">
                                        <span>
                                          <IconButton
                                            size="small"
                                            disabled={slideIndex === 0}
                                            onClick={() =>
                                              reorderSlides(
                                                slideIndex,
                                                slideIndex - 1,
                                              )
                                            }
                                          >
                                            <ArrowUpward />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title="Move item later">
                                        <span>
                                          <IconButton
                                            size="small"
                                            disabled={
                                              slideIndex === slides.length - 1
                                            }
                                            onClick={() =>
                                              reorderSlides(
                                                slideIndex,
                                                slideIndex + 1,
                                              )
                                            }
                                          >
                                            <ArrowDownward />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title="Remove item">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() =>
                                            removeSlide(slideIndex)
                                          }
                                        >
                                          <DeleteOutline />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </Stack>
                                  {isCustom ? (
                                    <Stack spacing={2}>
                                      <TextField
                                        label="Custom slide title"
                                        fullWidth
                                        value={slide.title || ""}
                                        onChange={(e) =>
                                          updateSlide(slide.id, (s) => ({
                                            ...s,
                                            title: e.target.value,
                                          }))
                                        }
                                        inputProps={{
                                          style: { fontSize: "1.1rem" },
                                        }}
                                      />
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                      >
                                        <Typography variant="h6">
                                          Custom lines
                                        </Typography>
                                        <Button
                                          variant="outlined"
                                          startIcon={<Add />}
                                          onClick={() =>
                                            updateCustomLines(
                                              slide.id,
                                              (lines) => [
                                                ...lines,
                                                {
                                                  id: makeId(),
                                                  arab: "",
                                                  rom: "",
                                                  eng: "",
                                                },
                                              ],
                                            )
                                          }
                                        >
                                          Add line
                                        </Button>
                                      </Stack>
                                      <Box
                                        sx={{
                                          maxHeight: "68vh",
                                          overflowY: "auto",
                                          pr: 0.5,
                                        }}
                                      >
                                        <Stack spacing={2}>
                                          {(slide.lines || []).map(
                                            (line, lineIndex) => (
                                              <Paper
                                                key={line.id}
                                                variant="outlined"
                                                draggable
                                                onDragStart={(e) => {
                                                  e.stopPropagation();
                                                  setCustomDrag({
                                                    slideId: slide.id,
                                                    index: lineIndex,
                                                  });
                                                  e.dataTransfer.effectAllowed =
                                                    "move";
                                                  e.dataTransfer.setData(
                                                    "text/plain",
                                                    String(lineIndex),
                                                  );
                                                }}
                                                onDragOver={(e) =>
                                                  onCustomDragOver(
                                                    e,
                                                    slide.id,
                                                    lineIndex,
                                                  )
                                                }
                                                onDrop={(e) =>
                                                  onCustomDrop(
                                                    e,
                                                    slide.id,
                                                    lineIndex,
                                                  )
                                                }
                                                onDragEnd={() => {
                                                  setCustomDrag(null);
                                                  setCustomDrop(null);
                                                }}
                                                sx={{
                                                  p: 2,
                                                  borderRadius: 2,
                                                  position: "relative",
                                                  ...(customDrop?.slideId ===
                                                    slide.id &&
                                                  customDrop.index === lineIndex
                                                    ? {
                                                        [`&::${customDrop.position === "before" ? "before" : "after"}`]:
                                                          {
                                                            content: '""',
                                                            position:
                                                              "absolute",
                                                            left: 8,
                                                            right: 8,
                                                            [customDrop.position ===
                                                            "before"
                                                              ? "top"
                                                              : "bottom"]: -5,
                                                            height: 3,
                                                            bgcolor:
                                                              "primary.main",
                                                            borderRadius: 2,
                                                            zIndex: 2,
                                                          },
                                                      }
                                                    : {}),
                                                }}
                                              >
                                                <Stack spacing={1.5}>
                                                  <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    spacing={1}
                                                  >
                                                    <DragIndicator
                                                      sx={{
                                                        cursor: "grab",
                                                        color: "text.secondary",
                                                      }}
                                                    />
                                                    <Typography
                                                      sx={{
                                                        flex: 1,
                                                        fontSize: "1.1rem",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      Line {lineIndex + 1}
                                                    </Typography>
                                                    <Tooltip title="Move up">
                                                      <span>
                                                        <IconButton
                                                          disabled={
                                                            lineIndex === 0
                                                          }
                                                          onClick={() =>
                                                            updateCustomLines(
                                                              slide.id,
                                                              (lines) =>
                                                                move(
                                                                  lines,
                                                                  lineIndex,
                                                                  lineIndex - 1,
                                                                ),
                                                            )
                                                          }
                                                        >
                                                          <ArrowUpward />
                                                        </IconButton>
                                                      </span>
                                                    </Tooltip>
                                                    <Tooltip title="Move down">
                                                      <span>
                                                        <IconButton
                                                          disabled={
                                                            lineIndex ===
                                                            slide.lines.length -
                                                              1
                                                          }
                                                          onClick={() =>
                                                            updateCustomLines(
                                                              slide.id,
                                                              (lines) =>
                                                                move(
                                                                  lines,
                                                                  lineIndex,
                                                                  lineIndex + 1,
                                                                ),
                                                            )
                                                          }
                                                        >
                                                          <ArrowDownward />
                                                        </IconButton>
                                                      </span>
                                                    </Tooltip>
                                                    <Tooltip title="Remove line">
                                                      <span>
                                                        <IconButton
                                                          color="error"
                                                          disabled={
                                                            slide.lines
                                                              .length === 1
                                                          }
                                                          onClick={() =>
                                                            updateCustomLines(
                                                              slide.id,
                                                              (lines) =>
                                                                lines.filter(
                                                                  (x) =>
                                                                    x.id !==
                                                                    line.id,
                                                                ),
                                                            )
                                                          }
                                                        >
                                                          <DeleteOutline />
                                                        </IconButton>
                                                      </span>
                                                    </Tooltip>
                                                  </Stack>
                                                  <TextField
                                                    label="Arabic (optional)"
                                                    multiline
                                                    minRows={2}
                                                    fullWidth
                                                    value={line.arab || ""}
                                                    inputProps={{
                                                      dir: "rtl",
                                                      style: {
                                                        fontSize: "1.6rem",
                                                        lineHeight: 1.8,
                                                      },
                                                    }}
                                                    onChange={(e) =>
                                                      updateCustomLine(
                                                        slide.id,
                                                        line.id,
                                                        "arab",
                                                        e.target.value,
                                                      )
                                                    }
                                                  />
                                                  <TextField
                                                    label="Transliteration (optional)"
                                                    multiline
                                                    minRows={2}
                                                    fullWidth
                                                    value={line.rom || ""}
                                                    inputProps={{
                                                      style: {
                                                        fontSize: "1.15rem",
                                                      },
                                                    }}
                                                    onChange={(e) =>
                                                      updateCustomLine(
                                                        slide.id,
                                                        line.id,
                                                        "rom",
                                                        e.target.value,
                                                      )
                                                    }
                                                  />
                                                  <TextField
                                                    label="English (optional)"
                                                    multiline
                                                    minRows={2}
                                                    fullWidth
                                                    value={line.eng || ""}
                                                    inputProps={{
                                                      style: {
                                                        fontSize: "1.15rem",
                                                      },
                                                    }}
                                                    onChange={(e) =>
                                                      updateCustomLine(
                                                        slide.id,
                                                        line.id,
                                                        "eng",
                                                        e.target.value,
                                                      )
                                                    }
                                                  />
                                                </Stack>
                                              </Paper>
                                            ),
                                          )}
                                        </Stack>
                                      </Box>
                                    </Stack>
                                  ) : (
                                    <>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>
                                          Presentation layout
                                        </InputLabel>
                                        <Select
                                          label="Presentation layout"
                                          value={slide.layout}
                                          onChange={(e) =>
                                            updateSlide(slide.id, (s) => ({
                                              ...s,
                                              layout: e.target.value,
                                            }))
                                          }
                                        >
                                          {slideshowLayoutOptions.map(
                                            (layout) => (
                                              <MenuItem
                                                key={layout}
                                                value={layout}
                                              >
                                                {layoutLabels[layout]}
                                              </MenuItem>
                                            ),
                                          )}
                                        </Select>
                                      </FormControl>
                                      {!nasheed && (
                                        <Alert severity="error">
                                          Source nasheed unavailable. This item
                                          cannot be saved until repaired.
                                        </Alert>
                                      )}
                                      <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                      >
                                        Performance sequence (drag blocks or use
                                        arrows)
                                      </Typography>
                                      <Box
                                        sx={{
                                          maxHeight: "68vh",
                                          minHeight: 120,
                                          overflowY: "auto",
                                          pr: 0.5,
                                          overscrollBehavior: "contain",
                                        }}
                                      >
                                        <Stack spacing={1.5}>
                                          {slide.blocks.map(
                                            (block, blockIndex) => {
                                              const lines = nasheed
                                                ? resolveSlideshowBlock(
                                                    block,
                                                    nasheed,
                                                  )
                                                : [];
                                              const expandedKey = `${slide.id}:${block.id}`;
                                              const expanded =
                                                expandedBlocks[expandedKey] !==
                                                false;
                                              const missingCount =
                                                block.lineIds.length -
                                                lines.length;
                                              return (
                                                <Paper
                                                  key={block.id}
                                                  variant="outlined"
                                                  draggable
                                                  onDragStart={(e) =>
                                                    onDragStart(e, {
                                                      kind: "block",
                                                      slideId: slide.id,
                                                      index: blockIndex,
                                                    })
                                                  }
                                                  onDragOver={(e) =>
                                                    onDragOverItem(e, {
                                                      kind: "block",
                                                      slideId: slide.id,
                                                      index: blockIndex,
                                                    })
                                                  }
                                                  onDrop={(e) => {
                                                    e.stopPropagation();
                                                    onDrop(e, {
                                                      kind: "block",
                                                      slideId: slide.id,
                                                      index: blockIndex,
                                                    });
                                                  }}
                                                  onDragEnd={clearDrag}
                                                  sx={{
                                                    borderRadius: 2,
                                                    overflow: "visible",
                                                    ...indicatorSx({
                                                      kind: "block",
                                                      slideId: slide.id,
                                                      index: blockIndex,
                                                    }),
                                                  }}
                                                >
                                                  <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    sx={{
                                                      px: 1.5,
                                                      py: 1.25,
                                                      bgcolor: "action.hover",
                                                      position: "relative",
                                                    }}
                                                    spacing={0.5}
                                                  >
                                                    <DragIndicator
                                                      fontSize="small"
                                                      sx={{
                                                        color: "text.disabled",
                                                        cursor: "grab",
                                                      }}
                                                    />
                                                    <Box
                                                      sx={{
                                                        position: "absolute",
                                                        left: "50%",
                                                        transform:
                                                          "translateX(-50%)",
                                                        textAlign: "center",
                                                        pointerEvents: "none",
                                                      }}
                                                    >
                                                      <Typography variant="h6">
                                                        {block.type ===
                                                        "refrain"
                                                          ? "Refrain"
                                                          : "Stanza"}{" "}
                                                        {blockIndex + 1}
                                                      </Typography>

                                                      <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                          display: "block",
                                                        }}
                                                      >
                                                        {block.lineIds.length}{" "}
                                                        lines
                                                      </Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 1 }} />
                                                    <Tooltip title="Move block up">
                                                      <span>
                                                        <IconButton
                                                          size="small"
                                                          disabled={
                                                            blockIndex === 0
                                                          }
                                                          onClick={() =>
                                                            updateBlocks(
                                                              slide.id,
                                                              (b) =>
                                                                move(
                                                                  b,
                                                                  blockIndex,
                                                                  blockIndex -
                                                                    1,
                                                                ),
                                                            )
                                                          }
                                                        >
                                                          <ArrowUpward fontSize="small" />
                                                        </IconButton>
                                                      </span>
                                                    </Tooltip>
                                                    <Tooltip title="Move block down">
                                                      <span>
                                                        <IconButton
                                                          size="small"
                                                          disabled={
                                                            blockIndex ===
                                                            slide.blocks
                                                              .length -
                                                              1
                                                          }
                                                          onClick={() =>
                                                            updateBlocks(
                                                              slide.id,
                                                              (b) =>
                                                                move(
                                                                  b,
                                                                  blockIndex,
                                                                  blockIndex +
                                                                    1,
                                                                ),
                                                            )
                                                          }
                                                        >
                                                          <ArrowDownward fontSize="small" />
                                                        </IconButton>
                                                      </span>
                                                    </Tooltip>
                                                    <Tooltip title="Duplicate block">
                                                      <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                          duplicateBlock(
                                                            slide.id,
                                                            blockIndex,
                                                          )
                                                        }
                                                      >
                                                        <ContentCopy fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Remove block">
                                                      <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                          updateBlocks(
                                                            slide.id,
                                                            (b) =>
                                                              b.filter(
                                                                (x) =>
                                                                  x.id !==
                                                                  block.id,
                                                              ),
                                                          )
                                                        }
                                                      >
                                                        <DeleteOutline fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                    <IconButton
                                                      size="small"
                                                      onClick={() =>
                                                        setExpandedBlocks(
                                                          (p) => ({
                                                            ...p,
                                                            [expandedKey]:
                                                              !expanded,
                                                          }),
                                                        )
                                                      }
                                                    >
                                                      {expanded ? (
                                                        <ExpandLess />
                                                      ) : (
                                                        <ExpandMore />
                                                      )}
                                                    </IconButton>
                                                  </Stack>
                                                  {missingCount > 0 && (
                                                    <Alert severity="warning">
                                                      {missingCount} missing or
                                                      invalid source line(s).
                                                    </Alert>
                                                  )}
                                                  <Collapse in={expanded}>
                                                    <Stack
                                                      spacing={1}
                                                      sx={{ p: 1 }}
                                                    >
                                                      {block.lineIds.map(
                                                        (lineId, lineIndex) => {
                                                          const line =
                                                            lines.find(
                                                              (l) =>
                                                                l.lineId ===
                                                                idOf(lineId),
                                                            );
                                                          return (
                                                            <Paper
                                                              key={`${block.id}-${lineIndex}`}
                                                              variant="outlined"
                                                              draggable
                                                              onDragStart={(
                                                                e,
                                                              ) => {
                                                                e.stopPropagation();
                                                                onDragStart(e, {
                                                                  kind: "line",
                                                                  slideId:
                                                                    slide.id,
                                                                  blockId:
                                                                    block.id,
                                                                  index:
                                                                    lineIndex,
                                                                });
                                                              }}
                                                              onDragOver={(e) =>
                                                                onDragOverItem(
                                                                  e,
                                                                  {
                                                                    kind: "line",
                                                                    slideId:
                                                                      slide.id,
                                                                    blockId:
                                                                      block.id,
                                                                    index:
                                                                      lineIndex,
                                                                  },
                                                                )
                                                              }
                                                              onDrop={(e) => {
                                                                e.stopPropagation();
                                                                onDrop(e, {
                                                                  kind: "line",
                                                                  slideId:
                                                                    slide.id,
                                                                  blockId:
                                                                    block.id,
                                                                  index:
                                                                    lineIndex,
                                                                });
                                                              }}
                                                              onDragEnd={(
                                                                e,
                                                              ) => {
                                                                e.stopPropagation();
                                                                clearDrag();
                                                              }}
                                                              sx={{
                                                                p: {
                                                                  xs: 2,
                                                                  md: 2.5,
                                                                },
                                                                borderRadius: 1.5,
                                                                ...indicatorSx({
                                                                  kind: "line",
                                                                  slideId:
                                                                    slide.id,
                                                                  blockId:
                                                                    block.id,
                                                                  index:
                                                                    lineIndex,
                                                                }),
                                                              }}
                                                            >
                                                              <Stack
                                                                direction="row"
                                                                alignItems="center"
                                                                spacing={0.5}
                                                              >
                                                                <DragIndicator
                                                                  fontSize="small"
                                                                  sx={{
                                                                    color:
                                                                      "text.disabled",
                                                                    cursor:
                                                                      "grab",
                                                                  }}
                                                                />
                                                                <Box
                                                                  sx={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                  }}
                                                                >
                                                                  {line ? (
                                                                    <LyricLine
                                                                      line={
                                                                        line
                                                                      }
                                                                      layout={
                                                                        slide.layout
                                                                      }
                                                                      compact
                                                                    />
                                                                  ) : (
                                                                    <Typography
                                                                      color="error"
                                                                      variant="caption"
                                                                    >
                                                                      Missing
                                                                      source
                                                                      line:{" "}
                                                                      {lineId}
                                                                    </Typography>
                                                                  )}
                                                                </Box>
                                                                <Stack>
                                                                  <Tooltip title="Move line up">
                                                                    <span>
                                                                      <IconButton
                                                                        size="small"
                                                                        disabled={
                                                                          lineIndex ===
                                                                          0
                                                                        }
                                                                        onClick={() =>
                                                                          updateBlock(
                                                                            slide.id,
                                                                            block.id,
                                                                            (
                                                                              b,
                                                                            ) => ({
                                                                              ...b,
                                                                              lineIds:
                                                                                move(
                                                                                  b.lineIds,
                                                                                  lineIndex,
                                                                                  lineIndex -
                                                                                    1,
                                                                                ),
                                                                            }),
                                                                          )
                                                                        }
                                                                      >
                                                                        <ArrowUpward fontSize="small" />
                                                                      </IconButton>
                                                                    </span>
                                                                  </Tooltip>
                                                                  <Tooltip title="Move line down">
                                                                    <span>
                                                                      <IconButton
                                                                        size="small"
                                                                        disabled={
                                                                          lineIndex ===
                                                                          block
                                                                            .lineIds
                                                                            .length -
                                                                            1
                                                                        }
                                                                        onClick={() =>
                                                                          updateBlock(
                                                                            slide.id,
                                                                            block.id,
                                                                            (
                                                                              b,
                                                                            ) => ({
                                                                              ...b,
                                                                              lineIds:
                                                                                move(
                                                                                  b.lineIds,
                                                                                  lineIndex,
                                                                                  lineIndex +
                                                                                    1,
                                                                                ),
                                                                            }),
                                                                          )
                                                                        }
                                                                      >
                                                                        <ArrowDownward fontSize="small" />
                                                                      </IconButton>
                                                                    </span>
                                                                  </Tooltip>
                                                                  <Tooltip title="Remove line from slideshow only">
                                                                    <IconButton
                                                                      size="small"
                                                                      color="error"
                                                                      onClick={() =>
                                                                        updateBlocks(
                                                                          slide.id,
                                                                          (
                                                                            blocks,
                                                                          ) =>
                                                                            blocks.flatMap(
                                                                              (
                                                                                b,
                                                                              ) => {
                                                                                if (
                                                                                  b.id !==
                                                                                  block.id
                                                                                )
                                                                                  return [
                                                                                    b,
                                                                                  ];
                                                                                const next =
                                                                                  b.lineIds.filter(
                                                                                    (
                                                                                      _,
                                                                                      i,
                                                                                    ) =>
                                                                                      i !==
                                                                                      lineIndex,
                                                                                  );
                                                                                return next.length
                                                                                  ? [
                                                                                      {
                                                                                        ...b,
                                                                                        lineIds:
                                                                                          next,
                                                                                      },
                                                                                    ]
                                                                                  : [];
                                                                              },
                                                                            ),
                                                                        )
                                                                      }
                                                                    >
                                                                      <Close fontSize="small" />
                                                                    </IconButton>
                                                                  </Tooltip>
                                                                </Stack>
                                                              </Stack>
                                                            </Paper>
                                                          );
                                                        },
                                                      )}
                                                    </Stack>
                                                  </Collapse>
                                                </Paper>
                                              );
                                            },
                                          )}
                                          {!slide.blocks.length && (
                                            <Alert severity="warning">
                                              No blocks remain. Remove this item
                                              or add it again from the library.
                                            </Alert>
                                          )}
                                        </Stack>
                                      </Box>
                                    </>
                                  )}
                                </Stack>
                              </CardContent>
                            </Card>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                  <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={0.8}
                    flexWrap="wrap"
                  >
                    {slides.map((slide, i) => (
                      <Box
                        key={slide.id}
                        component="button"
                        type="button"
                        aria-label={`Go to slideshow item ${i + 1}`}
                        onClick={() => navigateTo(i)}
                        sx={{
                          width: activeIndex === i ? 22 : 9,
                          height: 9,
                          border: 0,
                          borderRadius: 10,
                          cursor: "pointer",
                          p: 0,
                          bgcolor:
                            activeIndex === i
                              ? "primary.main"
                              : "action.disabled",
                          transition: "width .2s",
                        }}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </>
  );
};

export default CreateSlideshow;
