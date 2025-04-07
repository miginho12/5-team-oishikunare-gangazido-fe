import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .required('이름을 입력해주세요'),
  email: Yup.string()
    .email('유효한 이메일을 입력해주세요')
    .required('이메일을 입력해주세요'),
  password: Yup.string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다')
    .required('비밀번호를 입력해주세요'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], '비밀번호가 일치하지 않습니다')
    .required('비밀번호 확인을 입력해주세요'),
});

const Register = () => {
  const handleSubmit = async (values) => {
    try {
      const response = await axios.post('/api/auth/register', values);
      ////console.log(...)
      // 회원가입 성공 후 처리 (예: 로그인 페이지로 리다이렉트)
    } catch (error) {
      console.error('회원가입 실패:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
        </div>
        <Formik
          initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, getFieldProps }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="name" className="sr-only">
                    이름
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    {...getFieldProps('name')}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="이름"
                  />
                  {errors.name && touched.name && (
                    <div className="text-red-500 text-sm">{errors.name}</div>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    이메일
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    {...getFieldProps('email')}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="이메일"
                  />
                  {errors.email && touched.email && (
                    <div className="text-red-500 text-sm">{errors.email}</div>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    {...getFieldProps('password')}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="비밀번호"
                  />
                  {errors.password && touched.password && (
                    <div className="text-red-500 text-sm">{errors.password}</div>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    {...getFieldProps('confirmPassword')}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="비밀번호 확인"
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <div className="text-red-500 text-sm">{errors.confirmPassword}</div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  회원가입
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register; 