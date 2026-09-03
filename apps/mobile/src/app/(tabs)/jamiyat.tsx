import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, TextInput, Share, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import type { AppNotification, CommunityComment, CommunityPost, CommunityStats, CommunityTag, Dictionary } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, IconButton, LoadingSpinner, ScreenHeader } from "@/components/ui";

const TAGS: CommunityTag[] = ["cycle", "pregnancy", "checkups", "general"];
const PAGE_SIZE = 15;

function formatRelativeTime(iso: string, dict: Dictionary): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return dict.community.justNow;
  if (diffMin < 60) return dict.community.minutesAgo(diffMin);
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return dict.community.hoursAgo(diffHour);
  const diffDay = Math.floor(diffHour / 24);
  return dict.community.daysAgo(diffDay);
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("rounded-full border px-3 py-1.5 active:scale-95", active ? "border-primary bg-primary" : "border-border bg-surface")}
    >
      <Text className={clsx("text-xs font-medium", active ? "text-white" : "text-text-secondary")}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("h-7 w-12 rounded-full p-1", checked ? "bg-primary" : "bg-surface-muted")}>
      <View className={clsx("h-5 w-5 rounded-full bg-white", checked && "ml-5")} />
    </Pressable>
  );
}

export default function CommunityScreen() {
  const { dict } = useI18n();

  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [total, setTotal] = useState(0);
  const [tag, setTag] = useState<CommunityTag | "all">("all");
  const [loadingMore, setLoadingMore] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTag, setComposerTag] = useState<CommunityTag>("general");
  const [composerBody, setComposerBody] = useState("");
  const [composerAnonymous, setComposerAnonymous] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [openComments, setOpenComments] = useState<Record<string, CommunityComment[] | undefined>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const loadPosts = useCallback((currentTag: CommunityTag | "all") => {
    setPosts(null);
    api.community.listPosts({ tag: currentTag === "all" ? undefined : currentTag, limit: PAGE_SIZE, offset: 0 }).then((res) => {
      setPosts(res.posts);
      setTotal(res.total);
    });
  }, []);

  useEffect(() => {
    api.community.stats().then(setStats);
  }, []);

  useEffect(() => {
    api.notifications.list().then((res) => {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    });
  }, []);

  async function toggleNotifications() {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (opening && unreadCount > 0) {
      setUnreadCount(0);
      api.notifications.markAllRead().catch(() => {});
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => loadPosts(tag), 0);
    return () => clearTimeout(timeout);
  }, [tag, loadPosts]);

  async function loadMore() {
    if (!posts) return;
    setLoadingMore(true);
    try {
      const res = await api.community.listPosts({ tag: tag === "all" ? undefined : tag, limit: PAGE_SIZE, offset: posts.length });
      setPosts([...posts, ...res.posts]);
      setTotal(res.total);
    } finally {
      setLoadingMore(false);
    }
  }

  async function publish() {
    setComposerError(null);
    const text = composerBody.trim();
    if (text.length < 2) {
      setComposerError(dict.community.postTooShort);
      return;
    }
    setPublishing(true);
    try {
      const post = await api.community.createPost({ tag: composerTag, body: text, isAnonymous: composerAnonymous });
      if (tag === "all" || tag === post.tag) setPosts((prev) => (prev ? [post, ...prev] : [post]));
      setTotal((t) => t + 1);
      setStats((s) => (s ? { ...s, totalPosts: s.totalPosts + 1, postsToday: s.postsToday + 1 } : s));
      setComposerBody("");
      setComposerAnonymous(false);
      setComposerOpen(false);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    setPosts((prev) =>
      prev
        ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: !p.viewerLiked, likesCount: p.likesCount + (p.viewerLiked ? -1 : 1) } : p))
        : prev
    );
    try {
      const res = await api.community.toggleLike(post.id);
      setPosts((prev) => (prev ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: res.liked, likesCount: res.likesCount } : p)) : prev));
    } catch {
      setPosts((prev) =>
        prev ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: post.viewerLiked, likesCount: post.likesCount } : p)) : prev
      );
    }
  }

  async function toggleComments(post: CommunityPost) {
    if (openComments[post.id] !== undefined) {
      setOpenComments((prev) => ({ ...prev, [post.id]: undefined }));
      return;
    }
    const comments = await api.community.listComments(post.id);
    setOpenComments((prev) => ({ ...prev, [post.id]: comments }));
  }

  async function sendComment(post: CommunityPost) {
    const text = (commentDraft[post.id] ?? "").trim();
    if (!text) return;
    const comment = await api.community.addComment(post.id, { body: text, isAnonymous: false });
    setOpenComments((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), comment] }));
    setCommentDraft((prev) => ({ ...prev, [post.id]: "" }));
    setPosts((prev) => (prev ? prev.map((p) => (p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p)) : prev));
  }

  function removePost(post: CommunityPost) {
    Alert.alert(dict.community.deletePostButton, dict.community.deletePostConfirm, [
      { text: dict.common.cancel, style: "cancel" },
      {
        text: dict.community.deletePostButton,
        style: "destructive",
        onPress: async () => {
          await api.community.deletePost(post.id);
          setPosts((prev) => (prev ? prev.filter((p) => p.id !== post.id) : prev));
          setTotal((t) => Math.max(0, t - 1));
        },
      },
    ]);
  }

  function sharePost(post: CommunityPost) {
    Share.share({ message: `${dict.community.shareAppNameLabel}: ${post.body}` }).catch(() => {});
  }

  if (!posts && !stats) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-32">
        <ScreenHeader
          title={dict.community.title}
          subtitle={dict.community.subtitle}
          right={
            <View>
              <IconButton icon={<MaterialCommunityIcons name="bell-outline" size={18} color="#1F2937" />} onPress={toggleNotifications} />
              {unreadCount > 0 && (
                <View className="absolute -right-0.5 -top-0.5 h-4 w-4 items-center justify-center rounded-full bg-danger">
                  <Text className="text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </View>
          }
        />

        {notificationsOpen && (
          <Card className="gap-2">
            <Text className="font-semibold text-text-primary">{dict.community.notificationsTitle}</Text>
            {!notifications || notifications.length === 0 ? (
              <Text className="text-sm text-text-muted">{dict.community.notificationsEmpty}</Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} className={clsx("rounded-2xl p-3", n.isRead ? "bg-surface-muted" : "bg-primary-light/40")}>
                  <Text className="text-sm font-medium text-text-primary">
                    {dict.community.notificationCommentText(n.actorName ?? dict.community.anonymousAuthor)}
                  </Text>
                  <Text className="mt-0.5 text-xs text-text-secondary" numberOfLines={1}>
                    &ldquo;{n.postExcerpt}&rdquo;
                  </Text>
                  <Text className="mt-1 text-[11px] text-text-muted">{formatRelativeTime(n.createdAt, dict)}</Text>
                </View>
              ))
            )}
          </Card>
        )}

        {stats && (
          <Animated.View entering={FadeInUp.duration(450)} className="flex-row gap-3">
            <Card variant="flat" className="flex-1 items-center gap-0.5" style={{ padding: 12 }}>
              <Text className="text-lg font-extrabold text-text-primary">{stats.totalMembers}</Text>
              <Text className="text-[11px] text-text-secondary">{dict.community.statsMembers(stats.totalMembers)}</Text>
            </Card>
            <Card variant="flat" className="flex-1 items-center gap-0.5" style={{ padding: 12 }}>
              <Text className="text-lg font-extrabold text-text-primary">{stats.totalPosts}</Text>
              <Text className="text-[11px] text-text-secondary">{dict.community.statsPosts(stats.totalPosts)}</Text>
            </Card>
            <Card variant="flat" className="flex-1 items-center gap-0.5" style={{ padding: 12 }}>
              <Text className="text-lg font-extrabold text-text-primary">{stats.postsToday}</Text>
              <Text className="text-[11px] text-text-secondary">{dict.community.statsToday(stats.postsToday)}</Text>
            </Card>
          </Animated.View>
        )}

        <Button onPress={() => setComposerOpen((v) => !v)}>
          <Text className="text-sm font-semibold text-white">{dict.community.writePostButton}</Text>
        </Button>

        {composerOpen && (
          <Card className="gap-3">
            <Text className="font-semibold text-text-primary">{dict.community.writePostTitle}</Text>
            <TextInput
              value={composerBody}
              onChangeText={setComposerBody}
              placeholder={dict.community.writePostPlaceholder}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[96px] rounded-2xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />
            <View className="flex-row flex-wrap gap-2">
              {TAGS.map((t) => (
                <FilterChip key={t} active={composerTag === t} label={dict.community.tags[t]} onPress={() => setComposerTag(t)} />
              ))}
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-text-secondary">{dict.community.postAnonymouslyLabel}</Text>
              <Toggle checked={composerAnonymous} onPress={() => setComposerAnonymous((v) => !v)} />
            </View>
            {composerError && <Text className="text-sm text-danger">{composerError}</Text>}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button variant="ghost" onPress={() => setComposerOpen(false)} disabled={publishing}>
                  <Text className="text-sm font-semibold text-text-secondary">{dict.common.cancel}</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button onPress={publish} disabled={publishing || composerBody.trim().length < 2}>
                  <Text className="text-sm font-semibold text-white">{publishing ? dict.community.publishing : dict.community.publishButton}</Text>
                </Button>
              </View>
            </View>
          </Card>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
          <FilterChip active={tag === "all"} label={dict.community.filterAll} onPress={() => setTag("all")} />
          {TAGS.map((t) => (
            <FilterChip key={t} active={tag === t} label={dict.community.tags[t]} onPress={() => setTag(t)} />
          ))}
        </ScrollView>

        {!posts ? (
          <LoadingSpinner label={dict.common.loading} />
        ) : posts.length === 0 ? (
          <Card>
            <Text className="text-center text-sm text-text-secondary">{dict.community.emptyFeed}</Text>
          </Card>
        ) : (
          <>
            {posts.map((post) => {
              const comments = openComments[post.id];
              return (
                <Card key={post.id} className="gap-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 flex-row items-center gap-2.5">
                      <View
                        className={clsx(
                          "h-9 w-9 items-center justify-center rounded-full",
                          post.isAnonymous ? "bg-nav" : "bg-primary"
                        )}
                      >
                        {post.isAnonymous ? <MaterialCommunityIcons name="incognito" size={16} color="#FFFFFF" /> : <MaterialCommunityIcons name="account-outline" size={16} color="#FFFFFF" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                          {post.isAnonymous ? dict.community.anonymousAuthor : (post.authorName ?? dict.profile.noNameFallback)}
                        </Text>
                        <Text className="text-[11px] text-text-muted">{formatRelativeTime(post.createdAt, dict)}</Text>
                      </View>
                    </View>
                    <Badge tone="primary">{dict.community.tags[post.tag]}</Badge>
                  </View>

                  <Text className="text-sm text-text-primary">{post.body}</Text>

                  <View className="flex-row items-center gap-1 border-t border-border pt-2">
                    <Pressable onPress={() => toggleLike(post)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 active:scale-95">
                      <MaterialCommunityIcons
                        name={post.viewerLiked ? "heart" : "heart-outline"}
                        size={16}
                        color={post.viewerLiked ? "#E0506F" : "#4B5563"}
                      />
                      <Text className={clsx("text-xs font-semibold", post.viewerLiked ? "text-danger" : "text-text-secondary")}>{post.likesCount}</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleComments(post)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 active:scale-95">
                      <MaterialCommunityIcons name="message-outline" size={16} color="#4B5563" />
                      <Text className="text-xs font-semibold text-text-secondary">{post.commentsCount}</Text>
                    </Pressable>
                    <Pressable onPress={() => sharePost(post)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 active:scale-95">
                      <MaterialCommunityIcons name="share-variant-outline" size={16} color="#4B5563" />
                      <Text className="text-xs font-semibold text-text-secondary">{dict.community.shareButton}</Text>
                    </Pressable>
                    {post.isOwn && (
                      <Pressable onPress={() => removePost(post)} className="items-center justify-center rounded-xl px-3 py-2 active:scale-95">
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#E0506F" />
                      </Pressable>
                    )}
                  </View>

                  {comments !== undefined && (
                    <View className="gap-2.5 border-t border-border pt-3">
                      <Text className="text-xs font-semibold text-text-secondary">{dict.community.commentsTitle}</Text>
                      {comments.length === 0 && <Text className="text-xs text-text-muted">{dict.community.emptyComments}</Text>}
                      {comments.map((c) => (
                        <View key={c.id} className="flex-row items-start gap-2">
                          <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-surface-muted">
                            {c.isAnonymous ? <MaterialCommunityIcons name="incognito" size={12} color="#4B5563" /> : <MaterialCommunityIcons name="account-outline" size={12} color="#4B5563" />}
                          </View>
                          <View className="flex-1 rounded-2xl bg-surface-muted px-3 py-2">
                            <Text className="text-[11px] font-semibold text-text-secondary">
                              {c.isAnonymous ? dict.community.anonymousAuthor : (c.authorName ?? dict.profile.noNameFallback)}
                            </Text>
                            <Text className="text-sm text-text-primary">{c.body}</Text>
                          </View>
                        </View>
                      ))}
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={commentDraft[post.id] ?? ""}
                          onChangeText={(v) => setCommentDraft((prev) => ({ ...prev, [post.id]: v }))}
                          placeholder={dict.community.commentPlaceholder}
                          placeholderTextColor="#9CA3AF"
                          className="min-h-[44px] flex-1 rounded-full border border-border bg-surface px-4 text-base text-text-primary"
                        />
                        <Pressable
                          onPress={() => sendComment(post)}
                          disabled={!commentDraft[post.id]?.trim()}
                          className="tap-target items-center justify-center rounded-full bg-secondary-light px-4 active:scale-95 disabled:opacity-50"
                        >
                          <Text className="text-xs font-semibold text-text-primary">{dict.community.sendCommentButton}</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}

            {posts.length < total && (
              <Button variant="secondary" onPress={loadMore} disabled={loadingMore}>
                <Text className="text-sm font-semibold text-text-primary">{loadingMore ? dict.common.loading : dict.community.loadMoreButton}</Text>
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
