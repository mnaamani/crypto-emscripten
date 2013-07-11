/* mpi-pow.c  -  MPI functions for exponentiation
 * Copyright (C) 1994, 1996, 1998, 2000, 2002
 *               2003  Free Software Foundation, Inc.
 *
 * This file is part of Libgcrypt.
 *
 * Libgcrypt is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * Libgcrypt is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this program; if not, see <http://www.gnu.org/licenses/>.
 *
 * Note: This code is heavily based on the GNU MP Library.
 *	 Actually it's the same code with only minor changes in the
 *	 way the data is stored; this is to support the abstraction
 *	 of an optional secure memory allocation which may be used
 *	 to avoid revealing of sensitive data due to paging etc.
 */

#include <config.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "mpi-internal.h"
#include "longlong.h"

void
override_gcry_mpi_powm (gcry_mpi_t res,
               gcry_mpi_t base, gcry_mpi_t expo, gcry_mpi_t mod);
/****************
 * RES = BASE ^ EXPO mod MOD
 */
void
gcry_mpi_powm (gcry_mpi_t res,
               gcry_mpi_t base, gcry_mpi_t expo, gcry_mpi_t mod)
{
  override_gcry_mpi_powm(res,base,expo,mod);
}
