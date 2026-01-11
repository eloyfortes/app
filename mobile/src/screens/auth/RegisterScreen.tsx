import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';

// Cores do tema luxuoso para a tela de cadastro (mesmo do login)
const luxuryColors = {
  gold: '#D4AF37',
  goldLight: 'rgba(212, 175, 55, 0.3)',
  goldDark: '#B8941F',
  black: '#000000',
  blackLight: 'rgba(0, 0, 0, 0.8)',
  white: '#FFFFFF',
  whiteTransparent: 'rgba(255, 255, 255, 0.3)',
  whiteSubtle: 'rgba(255, 255, 255, 0.7)',
};

type RegisterStep = 'info' | 'password';

export default function RegisterScreen({ navigation }: any) {
  const [step, setStep] = useState<RegisterStep>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const handleNextStep = () => {
    if (!name || !email) {
      Alert.alert('Campos obrigatórios', 'Preencha nome e email para continuar');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email inválido', 'Digite um email válido');
      return;
    }

    setStep('password');
  };

  const handleRegister = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Campos obrigatórios', 'Preencha a senha e confirmação');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Senhas não coincidem', 'As senhas digitadas não são iguais');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha muito curta', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      Alert.alert(
        'Cadastro realizado',
        'Sua conta foi criada com sucesso! Aguarde a aprovação do administrador para acessar o sistema.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Erro ao cadastrar', error.message || 'Tente novamente mais tarde');
    } finally {
      setLoading(false);
    }
  };

  const renderInfoStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={luxuryColors.whiteSubtle} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Informações pessoais</Text>
        <Text style={styles.stepSubtitle}>Passo 1 de 2</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons 
          name="person-outline" 
          size={20} 
          color={luxuryColors.whiteSubtle} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          placeholderTextColor={luxuryColors.whiteTransparent}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons 
          name="mail-outline" 
          size={20} 
          color={luxuryColors.whiteSubtle} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={luxuryColors.whiteTransparent}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleNextStep}
          autoComplete="email"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!name || !email) && styles.buttonDisabled]}
        onPress={handleNextStep}
        disabled={!name || !email}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[luxuryColors.gold, luxuryColors.goldDark]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.buttonText}>CONTINUAR</Text>
        <Ionicons name="arrow-forward" size={20} color={luxuryColors.black} />
      </TouchableOpacity>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <TouchableOpacity
          onPress={() => setStep('info')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={luxuryColors.whiteSubtle} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Criar senha</Text>
        <Text style={styles.stepSubtitle}>Passo 2 de 2</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons 
          name="lock-closed-outline" 
          size={20} 
          color={luxuryColors.whiteSubtle} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Senha (mínimo 6 caracteres)"
          placeholderTextColor={luxuryColors.whiteTransparent}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          returnKeyType="next"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={luxuryColors.whiteSubtle}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons 
          name="lock-closed-outline" 
          size={20} 
          color={luxuryColors.whiteSubtle} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          placeholderTextColor={luxuryColors.whiteTransparent}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={luxuryColors.whiteSubtle}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={luxuryColors.black} />
        ) : (
          <>
            <LinearGradient
              colors={[luxuryColors.gold, luxuryColors.goldDark]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.buttonText}>CRIAR CONTA</Text>
            <Ionicons name="checkmark-circle" size={20} color={luxuryColors.black} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require('../../../img/login.webp')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10, 10, 10, 0.75)', 'rgba(10, 10, 10, 0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Logo style={styles.logo} />
              </View>

              {/* Formulário por passos */}
              <View style={styles.form}>
                {step === 'info' && renderInfoStep()}
                {step === 'password' && renderPasswordStep()}

                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.linkContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>
                    Já possui uma conta? <Text style={styles.linkBold}>Fazer login</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 32,
    paddingTop: 80,
    paddingBottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 200,
    height: 200,
    maxWidth: '70%',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  stepContent: {
    width: '100%',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: luxuryColors.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: luxuryColors.whiteTransparent,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: luxuryColors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    marginBottom: 20,
    shadowColor: luxuryColors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '300',
    color: luxuryColors.white,
    paddingVertical: 16,
    letterSpacing: 0.5,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: luxuryColors.gold,
    shadowColor: luxuryColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: luxuryColors.black,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  linkContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '300',
    color: luxuryColors.whiteSubtle,
    letterSpacing: 0.5,
  },
  linkBold: {
    fontWeight: '600',
    color: luxuryColors.gold,
  },
});
