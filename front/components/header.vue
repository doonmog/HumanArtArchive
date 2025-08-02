<template>
  <header class="w-full p-4 bg-white shadow-sm">
    <div class="container mx-auto">
      <nav class="flex flex-row items-center justify-between">
        <NuxtLink to="/" class="text-lg font-semibold text-gray-800 hover:text-gray-600">
          Human Art Archive
        </NuxtLink>
        
        <div class="mx-4 flex-grow max-w-md">
          <Search />
        </div>
        
        <NuxtLink to="/about" class="text-gray-600 hover:text-gray-800">
          About
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>