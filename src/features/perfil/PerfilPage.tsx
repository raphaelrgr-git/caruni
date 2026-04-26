import * as React from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Car,
  ChevronRight,
  CreditCard,
  EyeOff,
  Hand,
  HelpCircle,
  Lock,
  LogOut,
  MailCheck,
  Music,
  Repeat2,
  Save,
  Settings,
  Shield,
  Star,
  Timer,
  User,
  Users,
} from "lucide-react";
import { AppBackButton } from "@/components/AppBackButton";
import { Avatar } from "@/components/Brand";
import {
  blockConnection,
  getConnectionRoutes,
  getConnections,
  getUserProfile,
  hideConnection,
  removeConnection,
  uploadProfilePhoto,
  updateProfile,
  upgradeDriver,
  type ConnectionSummary,
  type UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTimePt } from "@/lib/labels";
import { toast } from "sonner";

function StarBar({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < filled ? "fill-warn text-warn" : "fill-surface-2 text-muted-foreground"}
        />
      ))}
    </span>
  );
}

function useProfileData(targetUserId?: string | null) {
  const { user } = useAuth();
  const resolvedId = targetUserId ?? user?.id;
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    setProfile(null); // clear stale data immediately when user changes
    try {
      setProfile(await getUserProfile(resolvedId));
    } finally {
      setLoading(false);
    }
  }, [resolvedId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}

export function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      void navigate({ to: "/login" });
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems = [
    {
      to: "/app/perfil/visualizar" as const,
      icon: User,
      title: "Ver perfil",
      description: "Foto, bio, reputação e preferências de viagem",
    },
    {
      to: "/app/perfil/configuracoes" as const,
      icon: Settings,
      title: "Configurações da conta",
      description: "Dados pessoais, edição do perfil e conta de motorista",
    },
    {
      to: "/app/perfil/conexoes" as const,
      icon: Users,
      title: "Conexões",
      description: "Pessoas com quem você já compartilhou caronas confirmadas",
    },
    {
      to: "/app/perfil/privacidade" as const,
      icon: Hand,
      title: "Privacidade",
      description: "O que o app mostra antes da primeira viagem",
    },
    {
      to: "/app/carteira" as const,
      icon: CreditCard,
      title: "Carteira",
      description: "Créditos, plano atual e extrato",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conta, privacidade, upgrade para motorista e acesso rápido à carteira.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[30px] border border-border bg-surface shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_45%),linear-gradient(135deg,rgba(15,118,110,0.08),rgba(249,115,22,0.12))] p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <Avatar
                name={user?.name ?? "Conta"}
                size={72}
                iniciais={(user?.name ?? "US").slice(0, 2).toUpperCase()}
                src={user?.photoUrl}
              />
              <div className="min-w-0">
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {user?.name ?? "Conta"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user?.role === "MOTORISTA" ? "Motorista" : "Passageiro"}
                  {user?.university?.name ? ` · ${user.university.name}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user?.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-[11px] font-medium text-success">
                      <MailCheck size={12} /> Email verificado
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                    {user?.role === "MOTORISTA" ? "Operando rotas" : "Conta de passageiro"}
                  </span>
                </div>
              </div>
            </div>

            {user?.role === "PASSAGEIRO" ? (
              <div className="mt-6 rounded-[24px] border border-border bg-background/75 p-5">
                <p className="text-lg font-semibold text-foreground">Torne-se um motorista</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Complete os dados do veículo e habilite a criação de rotas recorrentes.
                </p>
                <Link
                  to="/app/perfil/configuracoes"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <Car size={14} /> Configurar conta de motorista
                </Link>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-border bg-background/75 p-5">
                <p className="text-lg font-semibold text-foreground">Conta pronta para operar</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Suas rotas, ocupação e repasses ficam centralizados no app. Os dados do veículo
                  estão disponíveis nas configurações.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 lg:p-5">
            <div className="divide-y divide-border">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-4 px-2 py-4 transition-colors hover:bg-surface-2/60"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-foreground">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </Link>
                );
              })}

              <div className="px-2 py-4">
                <button
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-4 rounded-2xl px-0 py-0 text-left transition-colors hover:bg-surface-2/60"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/8 text-destructive">
                    <LogOut size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-foreground">
                      {loggingOut ? "Saindo..." : "Sair"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Encerrar a sessão atual do app
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-border bg-surface-2/50 p-4">
              <div className="flex items-start gap-3">
                <HelpCircle size={16} className="mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Ajuda rápida</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O chat da rota continua sendo o único canal de contato antes da primeira
                    viagem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileOverviewPage() {
  // Optional ?userId= search param allows viewing any user's public profile.
  // Falls back to the logged-in user when absent.
  const search = useSearch({ strict: false }) as { userId?: string };
  const targetUserId = search.userId ?? null;

  const { profile, loading } = useProfileData(targetUserId);

  // All display data comes exclusively from the fetched `profile` so the
  // logged-in user's auth state can never leak into another user's view.
  const currentYear = new Date().getFullYear();
  const age = profile?.birthYear ? currentYear - profile.birthYear : null;
  const stats = profile?.stats ?? null;
  const streak = profile?.streak ?? null;
  const displayName = profile?.name ?? "Usuário";

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando perfil…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <BackToProfile />
      <div className="mt-4 rounded-[30px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar
            name={displayName}
            size={88}
            iniciais={displayName.slice(0, 2).toUpperCase()}
            src={profile?.photoUrl}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.university?.name}
              {profile?.university?.city ? ` · ${profile.university.city}` : ""}
              {age ? ` · ${age} anos` : ""}
            </p>

            {stats && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {stats.avgRating != null ? (
                  <div className="flex items-center gap-1">
                    <StarBar value={stats.avgRating} />
                    <span className="text-sm font-semibold text-foreground">
                      {stats.avgRating.toFixed(1)}
                    </span>
                  </div>
                ) : null}
                <Badge text={`${stats.totalRides} viagens`} />
                <Badge text={`${stats.presenceRate}% presença`} />
                <Badge text={`${stats.cancellationRate}% cancel.`} />
                {streak?.current ? <Badge text={`${streak.current} em sequência`} tone="warn" /> : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <CardBlock title="Sobre mim">
        {profile?.bio ? (
          <p className="text-sm leading-relaxed text-foreground">{profile.bio}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            {targetUserId ? "Este usuário ainda não adicionou uma bio." : "Adicione uma bio para se apresentar aos outros usuários."}
          </p>
        )}
      </CardBlock>

      {(profile?.musicPref || profile?.chatPref || profile?.punctualityPref) && (
        <CardBlock title="Preferências de viagem">
          <div className="grid gap-3 sm:grid-cols-3">
            {profile.musicPref ? (
              <PreferenceCard icon={<Music size={14} />} label="Música" value={profile.musicPref} />
            ) : null}
            {profile.chatPref ? (
              <PreferenceCard icon={<User size={14} />} label="Conversa" value={profile.chatPref} />
            ) : null}
            {profile.punctualityPref ? (
              <PreferenceCard
                icon={<Timer size={14} />}
                label="Pontualidade"
                value={profile.punctualityPref}
              />
            ) : null}
          </div>
        </CardBlock>
      )}

      {!loading && profile && profile.reviews.length > 0 ? (
        <CardBlock title={`Avaliações (${profile.reviews.length})`}>
          <div className="space-y-4">
            {profile.reviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3">
                <Avatar name={review.from.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{review.from.name}</span>
                    <StarBar value={review.rating} />
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{review.body}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBlock>
      ) : null}
    </div>
  );
}

export function ProfileSettingsPage() {
  const { user, refreshMe, setUserFromMe } = useAuth();
  const [name, setName] = React.useState(user?.name ?? "");
  const [course, setCourse] = React.useState(user?.course ?? "");
  const [bio, setBio] = React.useState(user?.bio ?? "");
  const [birthYear, setBirthYear] = React.useState(String(user?.birthYear ?? ""));
  const [petsPref, setPetsPref] = React.useState(user?.petsPref ?? "");
  const [baggageSize, setBaggageSize] = React.useState(user?.baggageSize ?? "");
  const [temperaturePref, setTemperaturePref] = React.useState(user?.temperaturePref ?? "");
  const [restrictions, setRestrictions] = React.useState(user?.restrictions ?? "");
  const [socialStyle, setSocialStyle] = React.useState(user?.socialStyle ?? "");
  const [conversationStyle, setConversationStyle] = React.useState(user?.conversationStyle ?? "");
  const [musicPref, setMusicPref] = React.useState(user?.musicPref ?? "");
  const [chatPref, setChatPref] = React.useState(user?.chatPref ?? "");
  const [punctualityPref, setPunctualityPref] = React.useState(user?.punctualityPref ?? "");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState<string | null>(null);
  const [vehicleModel, setVehicleModel] = React.useState(user?.vehicle?.model ?? "");
  const [vehicleColor, setVehicleColor] = React.useState(user?.vehicle?.color ?? "");
  const [vehiclePlate, setVehiclePlate] = React.useState(user?.vehicle?.plate ?? "");

  React.useEffect(() => {
    setName(user?.name ?? "");
    setCourse(user?.course ?? "");
    setBio(user?.bio ?? "");
    setBirthYear(String(user?.birthYear ?? ""));
    setPetsPref(user?.petsPref ?? "");
    setBaggageSize(user?.baggageSize ?? "");
    setTemperaturePref(user?.temperaturePref ?? "");
    setRestrictions(user?.restrictions ?? "");
    setSocialStyle(user?.socialStyle ?? "");
    setConversationStyle(user?.conversationStyle ?? "");
    setMusicPref(user?.musicPref ?? "");
    setChatPref(user?.chatPref ?? "");
    setPunctualityPref(user?.punctualityPref ?? "");
    setPhotoFile(null);
    setVehicleModel(user?.vehicle?.model ?? "");
    setVehicleColor(user?.vehicle?.color ?? "");
    setVehiclePlate(user?.vehicle?.plate ?? "");
  }, [user]);

  React.useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const saveProfile = async () => {
    try {
      const updatedProfile = await updateProfile({
        name: name || undefined,
        course: course || null,
        bio: bio || null,
        birthYear: birthYear ? parseInt(birthYear, 10) : null,
        petsPref: petsPref || null,
        baggageSize: baggageSize || null,
        temperaturePref: temperaturePref || null,
        restrictions: restrictions || null,
        socialStyle: socialStyle || null,
        conversationStyle: conversationStyle || null,
        musicPref: musicPref || null,
        chatPref: chatPref || null,
        punctualityPref: punctualityPref || null,
      });
      const updatedUser = photoFile ? await uploadProfilePhoto(photoFile) : updatedProfile;
      setUserFromMe(updatedUser);
      setPhotoFile(null);
      toast.success("Perfil atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar perfil.");
    }
  };

  const becomeDriver = async () => {
    try {
      await upgradeDriver({ model: vehicleModel, color: vehicleColor, plate: vehiclePlate });
      await refreshMe();
      toast.success("Conta atualizada para motorista.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar papel.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <BackToProfile />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        Configurações da conta
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edite seu perfil e configure a conta de motorista.
      </p>

      <CardBlock title="Perfil">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <input value={name} onChange={(e) => setName(e.target.value)} className="field-input mt-1" />
          </Field>
          <Field label="Curso">
            <input value={course} onChange={(e) => setCourse(e.target.value)} className="field-input mt-1" />
          </Field>
          <Field label="Foto de perfil">
            <div className="mt-1 flex items-center gap-3">
              <Avatar name={name || user?.name || "Perfil"} src={photoPreviewUrl ?? user?.photoUrl} size={44} />
              <label className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground">
                Escolher imagem
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {photoFile ? `Imagem selecionada: ${photoFile.name}` : "JPG ou PNG com até 5 MB."}
            </p>
          </Field>
          <Field label="Ano de nascimento">
            <input
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="field-input mt-1"
            />
          </Field>
          <Field label={`Bio (${bio.length}/300)`} className="sm:col-span-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              rows={3}
              className="field-input mt-1 resize-none"
            />
          </Field>
        </div>
      </CardBlock>

      <CardBlock title="Preferências de viagem">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Música">
            <select value={musicPref} onChange={(e) => setMusicPref(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Qualquer estilo</option>
              <option>Sem música</option>
              <option>Depende do humor</option>
              <option>Só música suave</option>
            </select>
          </Field>
          <Field label="Conversa">
            <select value={chatPref} onChange={(e) => setChatPref(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Adoro conversar</option>
              <option>Prefiro silêncio</option>
              <option>Tanto faz</option>
            </select>
          </Field>
          <Field label="Pontualidade">
            <select
              value={punctualityPref}
              onChange={(e) => setPunctualityPref(e.target.value)}
              className="field-input mt-1"
            >
              <option value="">Não informado</option>
              <option>Muito pontual</option>
              <option>Normalmente pontual</option>
              <option>Flexível</option>
            </select>
          </Field>
          <Field label="Pets">
            <select value={petsPref} onChange={(e) => setPetsPref(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Tenho pet</option>
              <option>Não tenho pet</option>
              <option>Tenho alergia</option>
            </select>
          </Field>
          <Field label="Bagagem">
            <select value={baggageSize} onChange={(e) => setBaggageSize(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Leve</option>
              <option>Média</option>
              <option>Grande</option>
            </select>
          </Field>
          <Field label="Temperatura">
            <select value={temperaturePref} onChange={(e) => setTemperaturePref(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Gosto de frio</option>
              <option>Neutro</option>
              <option>Gosto de calor</option>
            </select>
          </Field>
          <Field label="Estilo social">
            <select value={socialStyle} onChange={(e) => setSocialStyle(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Extrovertido</option>
              <option>Neutro</option>
              <option>Introvertido</option>
            </select>
          </Field>
          <Field label="Convívio">
            <select value={conversationStyle} onChange={(e) => setConversationStyle(e.target.value)} className="field-input mt-1">
              <option value="">Não informado</option>
              <option>Prefiro silêncio</option>
              <option>Prefiro conversa</option>
              <option>Tanto faz</option>
            </select>
          </Field>
          <Field label="Restrições" className="sm:col-span-3">
            <input
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value.slice(0, 160))}
              className="field-input mt-1"
              placeholder="Ex.: não fumar, sem comida forte, sem perfume"
            />
          </Field>
        </div>

        <button
          onClick={() => void saveProfile()}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Save size={14} /> Salvar alterações
        </button>
      </CardBlock>

      {user?.role === "PASSAGEIRO" ? (
        <CardBlock title="Tornar-se motorista">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Modelo">
              <input
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="field-input mt-1"
              />
            </Field>
            <Field label="Cor">
              <input
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                className="field-input mt-1"
              />
            </Field>
            <Field label="Placa">
              <input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="field-input mt-1"
              />
            </Field>
          </div>
          <button
            onClick={() => void becomeDriver()}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
          >
            <Car size={14} /> Habilitar conta de motorista
          </button>
        </CardBlock>
      ) : (
        <CardBlock title="Dados do veículo">
          <div className="rounded-[22px] border border-border bg-surface-2/60 p-4">
            <p className="text-base font-medium text-foreground">
              {user?.vehicle?.model} · {user?.vehicle?.color}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Placa {user?.vehicle?.plate}</p>
          </div>
        </CardBlock>
      )}
    </div>
  );
}

export function ProfilePrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <BackToProfile />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O app reduz troca de contato e protege os detalhes sensíveis da rota antes da primeira
        viagem.
      </p>

      <CardBlock title="Como o app protege sua conta">
        <div className="space-y-3">
          <PrivacyRow
            icon={<Shield size={16} />}
            title="Origem e destino precisos não aparecem para qualquer pessoa"
            description="Antes da primeira viagem, o mapa mostra a rota com anonimização dos extremos."
          />
          <PrivacyRow
            icon={<MailCheck size={16} />}
            title="Seu email não é exibido publicamente"
            description="A verificação de email serve para confiança da conta, não para exposição do contato."
          />
          <PrivacyRow
            icon={<Hand size={16} />}
            title="Contato só dentro do chat da rota"
            description="A comunicação inicial acontece no chat interno da rota para reduzir desintermediação."
          />
        </div>
      </CardBlock>
    </div>
  );
}

export function ProfileConnectionsPage() {
  const navigate = useNavigate();
  const [sort, setSort] = React.useState<"recentes" | "recorrentes">("recorrentes");
  const [connections, setConnections] = React.useState<ConnectionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setConnections(await getConnections(sort));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar conexões.");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const repeatRide = async (connectionId: string) => {
    try {
      const routes = await getConnectionRoutes(connectionId);
      if (!routes.length) {
        toast.error("Essa conexão ainda não tem rotas publicadas para reservar.");
        return;
      }
      void navigate({ to: "/app/rota/$id", params: { id: routes[0]!.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao abrir rota da conexão.");
    }
  };

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar conexão.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8 lg:py-10">
      <BackToProfile />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Conexões</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pessoas com quem você já viajou e pode reencontrar com menos atrito.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-border bg-surface-2 p-1">
          {(["recorrentes", "recentes"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSort(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                sort === option ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {option === "recorrentes" ? "Recorrentes" : "Recentes"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando conexões…</p>
      ) : connections.length === 0 ? (
        <CardBlock title="Sua rede ainda está começando">
          <p className="text-sm text-muted-foreground">
            Assim que uma viagem for confirmada pelos dois lados, as conexões aparecem aqui.
          </p>
        </CardBlock>
      ) : (
        <div className="mt-6 space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="rounded-[28px] border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={connection.connectedUser.name}
                    size={54}
                    iniciais={connection.connectedUser.name.slice(0, 2).toUpperCase()}
                    src={connection.connectedUser.photoUrl}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">
                        {connection.connectedUser.name}
                      </p>
                      {connection.strong ? <Badge text="Parceria recorrente" tone="warn" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {connection.connectedUser.university?.name ?? "Universidade não informada"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge text={`${connection.tripsTogether} viagem(ns) juntos`} />
                      <Badge text={formatRelativeTimePt(connection.lastInteractedAt)} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/app/perfil/visualizar"
                    search={{ userId: connection.connectedUser.id }}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                  >
                    <User size={15} /> Ver perfil
                  </Link>
                  <button
                    onClick={() => void repeatRide(connection.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <Repeat2 size={15} /> Viajar novamente
                  </button>
                  <button
                    onClick={() =>
                      void runAction(() => hideConnection(connection.id), "Conexão ocultada.")
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                  >
                    <EyeOff size={15} /> Ocultar
                  </button>
                  <button
                    onClick={() =>
                      void runAction(() => blockConnection(connection.id), "Conexão bloqueada.")
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground"
                  >
                    <Lock size={15} /> Bloquear
                  </button>
                  <button
                    onClick={() =>
                      void runAction(() => removeConnection(connection.id), "Conexão removida.")
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackToProfile() {
  return <AppBackButton fallbackTo="/app/perfil" />;
}

function CardBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-[30px] border border-border bg-surface p-5 shadow-sm lg:p-6">
      <p className="label-cockpit text-[10px] text-muted-foreground">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Badge({ text, tone = "default" }: { text: string; tone?: "default" | "warn" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
        tone === "warn" ? "bg-warn/15 text-warn" : "bg-surface-2 text-foreground"
      }`}
    >
      {text}
    </span>
  );
}

function PreferenceCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-border bg-surface-2/60 p-4">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xs font-medium text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="label-cockpit text-[10px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PrivacyRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-border bg-surface-2/60 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
