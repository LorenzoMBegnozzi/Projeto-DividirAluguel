package com.rachaai.common;

/**
 * Valida CPF pelos dígitos verificadores oficiais (módulo 11). Não consulta nenhuma base
 * externa — só confirma que o número é matematicamente possível, não que existe de verdade.
 */
public final class CpfValidator {

    private CpfValidator() {
    }

    public static String onlyDigits(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    public static boolean isValid(String cpf) {
        String digits = onlyDigits(cpf);
        if (digits.length() != 11 || digits.chars().distinct().count() == 1) {
            return false;
        }
        String base = digits.substring(0, 9);
        String firstDigit = String.valueOf(checkDigit(base, 10));
        String secondDigit = String.valueOf(checkDigit(base + firstDigit, 11));
        return digits.equals(base + firstDigit + secondDigit);
    }

    private static int checkDigit(String base, int firstWeight) {
        int sum = 0;
        int weight = firstWeight;
        for (int i = 0; i < base.length(); i++) {
            sum += (base.charAt(i) - '0') * weight--;
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}
