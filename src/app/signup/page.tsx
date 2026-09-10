"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [groupName, setGroupName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [storeCity, setStoreCity] = useState("");

  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStep(2);
  }

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    let currentGroupId = groupId;
    if (!currentGroupId) {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, groupName }),
      });
      if (signupRes.status !== 201) {
        if (signupRes.status === 409) {
          setError("Esse e-mail já está cadastrado.");
        } else {
          setError("Não foi possível criar sua conta. Confira os dados e tente de novo.");
        }
        setStep(1);
        return;
      }
      const signupData = await signupRes.json();
      currentGroupId = signupData.groupId;
      setGroupId(currentGroupId);
    }

    const storeRes = await fetch("/api/stores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId: currentGroupId, name: storeName, code: storeCode, city: storeCity }),
    });
    if (storeRes.status !== 201) {
      setError("Não foi possível adicionar a loja. Confira os dados e tente de novo.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="onboard">
      <div className="onboard-wrap">
        <div className="onboard-brand">
          <div className="onboard-brand-mark">K</div>
          <div className="onboard-brand-name">Katalagge</div>
        </div>

        <div className="steps">
          <div className={`step-chip ${step === 1 ? "active" : "done"}`}>
            <span className="n">{step === 1 ? "1" : "✓"}</span>Grupo
          </div>
          <div className={`step-chip ${step === 2 ? "active" : ""}`}>
            <span className="n">2</span>Loja
          </div>
        </div>

        {step === 1 ? (
          <div className="onboard-card">
            <h1>Crie o grupo da sua franquia</h1>
            <p className="lede">
              O grupo reúne todas as lojas da franquia num só lugar. Você vira administrador dele.
            </p>

            <form onSubmit={handleStep1Submit}>
              <div className="field">
                <label htmlFor="grupoNome">Nome do grupo (franquia)</label>
                <input
                  id="grupoNome"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="field">
                <label htmlFor="grupoEmail">E-mail</label>
                <input
                  id="grupoEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="grupoSenha">Senha</label>
                <input
                  id="grupoSenha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <span className="field-hint">Mínimo de 8 caracteres</span>
              </div>

              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}

              <div className="onboard-actions">
                <Link href="/login" className="link-btn">
                  Já tenho conta
                </Link>
                <button className="btn btn-primary" type="submit">
                  Criar grupo
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="onboard-card">
            <h1>Agora, cadastre sua primeira loja</h1>
            <p className="lede">
              Cada loja da franquia entra separada — assim dá pra ver a conciliação de cada uma e cobrar só
              pelas que estiverem ativas. As fontes de dados dela você conecta depois, em Configurações.
            </p>

            <form onSubmit={handleStep2Submit}>
              <div className="field">
                <label htmlFor="lojaNome">Nome da loja</label>
                <input
                  id="lojaNome"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="lojaCod">Código da loja</label>
                  <input
                    id="lojaCod"
                    type="text"
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    required
                  />
                  <span className="field-hint">Usado nos relatórios pra identificar a loja</span>
                </div>
                <div className="field">
                  <label htmlFor="lojaCidade">Cidade</label>
                  <input
                    id="lojaCidade"
                    type="text"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}

              <div className="onboard-actions">
                <button className="link-btn" type="button" onClick={() => setStep(1)}>
                  Voltar
                </button>
                <button className="btn btn-primary" type="submit">
                  Concluir cadastro
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
