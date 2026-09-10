"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardShell } from "@/components/OnboardShell";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

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
    <OnboardShell>
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
            <Field
              id="grupoNome"
              label="Nome do grupo (franquia)"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              minLength={2}
            />
            <Field
              id="grupoEmail"
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              id="grupoSenha"
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              hint="Mínimo de 8 caracteres"
            />

            <FormError message={error} />

            <div className="onboard-actions">
              <Link href="/login" className="link-btn">
                Já tenho conta
              </Link>
              <Button type="submit">Criar grupo</Button>
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
            <Field
              id="lojaNome"
              label="Nome da loja"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              minLength={2}
            />
            <div className="field-row">
              <Field
                id="lojaCod"
                label="Código da loja"
                type="text"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                required
                hint="Usado nos relatórios pra identificar a loja"
              />
              <Field
                id="lojaCidade"
                label="Cidade"
                type="text"
                value={storeCity}
                onChange={(e) => setStoreCity(e.target.value)}
                required
              />
            </div>

            <FormError message={error} />

            <div className="onboard-actions">
              <button className="link-btn" type="button" onClick={() => setStep(1)}>
                Voltar
              </button>
              <Button type="submit">Concluir cadastro</Button>
            </div>
          </form>
        </div>
      )}
    </OnboardShell>
  );
}
