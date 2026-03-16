var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Armazenador } from "./Armazenador.js";
import { ValidaDebito, ValidaDeposito } from "./Decorators.js";
import { TipoTransacao } from "./TipoTransacao.js";
export class Conta {
    nome;
    saldo = Armazenador.obter("saldo") || 0;
    transacoes = Armazenador.obter(("transacoes"), (key, value) => {
        if (key === "data") {
            return new Date(value);
        }
        return value;
    }) || [];
    constructor(nome) {
        this.nome = nome;
    }
    debitar(valor) {
        this.saldo -= valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }
    depositar(valor) {
        this.saldo += valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }
    getGruposTransacoes() {
        const GruposTransacoes = [];
        const listaTransacoes = structuredClone(this.transacoes);
        // Ordenação decrescente das datas
        const transacoesOrdenadas = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
        let labelAtualGrupoTransacao = "";
        for (let transacao of transacoesOrdenadas) {
            let labelGrupoTransacao = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });
            if (labelAtualGrupoTransacao != labelGrupoTransacao) {
                labelAtualGrupoTransacao = labelGrupoTransacao;
                GruposTransacoes.push({
                    label: labelGrupoTransacao,
                    transacoes: []
                });
            }
            // Ao adicionar um novo grupo, sempre vamos ao último grupo da lista e ADICIONAMOS a nova transação à lista de transações deste grupo
            GruposTransacoes.at(-1).transacoes.push(transacao);
        }
        return GruposTransacoes;
    }
    registrarTransacao(novaTransacao) {
        if (novaTransacao.tipoTransacao === TipoTransacao.DEPOSITO) {
            this.depositar(novaTransacao.valor);
        }
        else if (novaTransacao.tipoTransacao === TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao === TipoTransacao.BOLETO) {
            this.debitar(novaTransacao.valor);
            // Deixa o valor negativo, indicando no extrato que o valor foi retirado e não adicionado na conta.
            novaTransacao.valor *= -1;
        }
        else {
            throw new Error("Tipo de transação é inválido!");
        }
        this.transacoes.push(novaTransacao);
        Armazenador.salvar("transacoes", JSON.stringify(this.transacoes));
    }
    getTitular() {
        return this.nome;
    }
    getSaldo() {
        return this.saldo;
    }
    getDataAcesso() {
        return new Date();
    }
}
__decorate([
    ValidaDebito
], Conta.prototype, "debitar", null);
__decorate([
    ValidaDeposito
], Conta.prototype, "depositar", null);
export class ContaPremium extends Conta {
    registrarTransacao(transacao) {
        if (transacao.tipoTransacao === TipoTransacao.DEPOSITO) {
            console.log("ganhou um bônus de 0.50 centavos!");
            transacao.valor += 0.5;
        }
        super.registrarTransacao(transacao);
    }
}
const conta = new Conta("Joana da Silva Oliveira");
const contaPremium = new ContaPremium("Juan Muradas");
export default conta;
